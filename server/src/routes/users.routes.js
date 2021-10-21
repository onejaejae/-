// user
const USER = "/users";

//logout
const LOGOUT = "/logout";

// jwt
const JWT = "/jwt";

// refresh
const REFRESH = "/refresh";

// seat
const SEAT = "/seat";

const ACTIVITY = "/activity";
const ACTIVITY_REVIEW = "/activity/review";

const PROFILE = "/profile";

const userRoutes = {
  user: USER,
  logout: LOGOUT,
  refresh: REFRESH,
  jwt: JWT,
  seat: SEAT,
  activity: ACTIVITY,
  activityReview: ACTIVITY_REVIEW,
  profile: PROFILE,
};

export default userRoutes;
