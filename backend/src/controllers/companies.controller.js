import { prisma } from "../db/prismaClient.js";
import { companyInclude, companyToApi } from "../db/companySerializer.js";
import { READINESS_METRICS, READINESS_YEARS } from "../data/readinessConfig.js";
import { badRequest, notFound, parseCompanyId } from "../utils/http.js";
import {
  BATCH_MAX,
  BATCH_MIN,
  MAX_LOGIN_EMAILS,
  isEmail,
  isIntInRange,
  isNonEmptyString,
  isPlainObject,
} from "../utils/validation.js";

// Login emails are stored lowercase so the Google sign-in lookup (which lowercases
// the account email) always matches.
const normalizeEmails = (emails) => emails.map((e) => e.trim().toLowerCase());

// Validates the settings fields shared by createCompany and updateCompanySettings.
// Returns an error message, or null. Missing fields only pass when `required` is false.
function validateSettings({ loginEmails, description, batch }, { required }) {
  const missing = (v) => v === undefined && !required;
  if (
    !missing(loginEmails) &&
    (!Array.isArray(loginEmails) || loginEmails.length > MAX_LOGIN_EMAILS || !loginEmails.every(isEmail))
  ) {
    return `loginEmails must be an array of up to ${MAX_LOGIN_EMAILS} valid emails`;
  }
  if (!missing(loginEmails) && new Set(normalizeEmails(loginEmails)).size !== loginEmails.length) {
    return "loginEmails must not contain duplicates";
  }
  if (!missing(description) && (typeof description !== "string" || description.length > 2000)) {
    return "description must be a string of at most 2000 characters";
  }
  if (!missing(batch) && !isIntInRange(batch, BATCH_MIN, BATCH_MAX)) {
    return `batch must be an integer from ${BATCH_MIN} to ${BATCH_MAX}`;
  }
  return null;
}

// An email can log in to only one account: the sign-in lookup takes the first
// match, so a shared (or admin) email would open the wrong panel. Returns an
// error message when any of `emails` is already taken, else null.
async function findEmailConflict(emails, ignoreCompanyId) {
  const [admin, other] = await Promise.all([
    prisma.adminEmail.findFirst({ where: { email: { in: emails } } }),
    prisma.companyLoginEmail.findFirst({
      where: {
        email: { in: emails },
        ...(ignoreCompanyId ? { NOT: { companyId: ignoreCompanyId } } : {}),
      },
    }),
  ]);
  const taken = admin?.email ?? other?.email;
  return taken ? `${taken} is already used by another account` : null;
}

async function findCompanyOr404(id, res) {
  const company =
    id === null ? null : await prisma.company.findUnique({ where: { id }, include: companyInclude });
  if (!company) {
    notFound(res);
    return null;
  }
  return company;
}

export async function getCompanies(req, res) {
  const companies = await prisma.company.findMany({
    orderBy: { id: "asc" },
    include: companyInclude,
  });
  res.json(companies.map(companyToApi));
}

export async function getCompanyById(req, res) {
  const company = await findCompanyOr404(parseCompanyId(req.params.id), res);
  if (company) res.json(companyToApi(company));
}

// The company the logged-in company user belongs to (admins have none).
export async function getCurrentCompany(req, res) {
  const { role, companyId } = req.session;
  const company = await findCompanyOr404(role === "company" ? companyId : null, res);
  if (company) res.json(companyToApi(company));
}

export async function createCompany(req, res) {
  const body = isPlainObject(req.body) ? req.body : {};
  const { name, contactEmail, loginEmails, description, batch } = body;
  if (!isNonEmptyString(name, 200) || !isEmail(contactEmail)) {
    return badRequest(res, "name and contactEmail are required");
  }
  const settingsError = validateSettings(body, { required: false });
  if (settingsError) return badRequest(res, settingsError);

  // No login emails given → the primary contact can log in.
  const emails = normalizeEmails(loginEmails?.length ? loginEmails : [contactEmail]);
  const emailConflict = await findEmailConflict(emails);
  if (emailConflict) return res.status(409).json({ error: emailConflict });

  const company = await prisma.company.create({
    data: {
      name: name.trim(),
      contactEmail,
      settingsDescription: description ?? "",
      settingsBatch: batch ?? 1,
      loginEmails: { create: emails.map((email, position) => ({ position, email })) },
      readinessLevels: {
        create: READINESS_YEARS.flatMap((year) =>
          READINESS_METRICS.map((metric) => ({ year, metric, value: 0 })),
        ),
      },
    },
    include: companyInclude,
  });
  res.status(201).json(companyToApi(company));
}

export async function updateCompanySettings(req, res) {
  const id = parseCompanyId(req.params.id);
  const body = isPlainObject(req.body) ? req.body : {};
  const { loginEmails, description, batch } = body;
  const settingsError = validateSettings(body, { required: true });
  if (settingsError) return badRequest(res, settingsError);

  const emails = normalizeEmails(loginEmails);
  const emailConflict = id === null ? null : await findEmailConflict(emails, id);
  if (emailConflict) return res.status(409).json({ error: emailConflict });

  const updated = await prisma.$transaction(async (tx) => {
    if (id === null || !(await tx.company.findUnique({ where: { id }, select: { id: true } }))) {
      return null;
    }
    await tx.companyLoginEmail.deleteMany({ where: { companyId: id } });
    return tx.company.update({
      where: { id },
      data: {
        settingsDescription: description,
        settingsBatch: batch,
        loginEmails: {
          create: emails.map((email, position) => ({ position, email })),
        },
      },
      include: companyInclude,
    });
  });
  if (!updated) return notFound(res);
  res.json(companyToApi(updated));
}

export async function deleteCompany(req, res) {
  const id = parseCompanyId(req.params.id);
  // Readiness levels, answers, guide progress and login emails go with it
  // (onDelete: Cascade in schema.prisma).
  const { count } = id === null ? { count: 0 } : await prisma.company.deleteMany({ where: { id } });
  if (count === 0) return notFound(res);
  res.status(204).end();
}
