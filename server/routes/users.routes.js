// user
const USER = "/users";

// local register
const REGISTER = "/register";

//logout
const LOGOUT = "/logout";

// kakao
const KAKAO_START = "/kakao/start";
const KAKAO_FINISH = "/kakao/finish";

// jwt
const JWT = "/jwt";

// refresh
const REFRESH = "/refresh";

const userRoutes = {
  user: USER,
  register: REGISTER,
  logout: LOGOUT,
  kakaoStart: KAKAO_START,
  kakaoFinish: KAKAO_FINISH,
  refresh: REFRESH,
  jwt: JWT,
};

export default userRoutes;
