import throwError from "../utils/throwError";

const { KAKAO_CLIENT_ID, KAKAO_SECRET, KAKAO_REDIRECT_URL } = process.env;

export const getLogout = (req, res, next) => {
  try {
    if (!req.session.loggedIn) return next(throwError(400, "권한이 없습니다."));

    req.session.destroy();
    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};

// kakao

export const kakaoLoginCallback = async (
  accessToken,
  refreshToken,
  profile,
  done
) => {
  try {
    const user = await User.findOne({ email });

    if (user) {
      user.kakaoId = id;
      await user.save();

      return done(null, user);
    } else {
      const newUser = await User.create({
        kakaoId: id,
        nickname,
        email,
      });

      return done(null, newUser);
    }
  } catch (error) {
    console.log("error", error);
    return done(error);
  }
};
