import User from "../models/User";

const userExist = async (id) => {
  try {
    const user = await User.findOne(id);
    return user;
  } catch (error) {
    console.error(error);
  }
};

export default userExist;
