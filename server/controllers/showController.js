import fetch from "node-fetch";
import axios from "axios";

export const getShow = async (req, res, next) => {
  try {
    const { page, code } = req.query;

    const baseUrl = `http://www.kopis.or.kr/openApi/restful/pblprfr?service=${process.env.OPENAPI_SECRET_KEY}&stdate=20180101&eddate=20211231&rows=10`;

    const config = {
      cpage: page,
      code,
    };

    const params = new URLSearchParams(config).toString();
    const finalUrl = `${baseUrl}&${params}`;

    console.log(finalUrl);
    const data = await axios.get(finalUrl);
    console.log(data);

    // res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};
