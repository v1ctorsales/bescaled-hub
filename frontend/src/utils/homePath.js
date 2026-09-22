// Where each role lands after login (and when it opens a page meant for the other role).
export const homePathFor = (user) => (user.role === "admin" ? "/admin" : "/dashboard");
