import Theater from "../models/Theater";

export const getTheater = async (req, res, next) => {
  try {
    const { sort, page = 0 } = req.query;

    const variable = sort === "review" ? { reviewCount: -1 } : { name: 1 };
    const theater = await Theater.find({})
      .sort(variable)
      .skip(page * 10)
      .limit(10);

    res.status(200).json({ success: true, data: theater });
  } catch (error) {
    next(error);
  }
};
