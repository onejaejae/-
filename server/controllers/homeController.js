import axios from "axios";
import convert from "xml-js";
import Show from "../models/Show";

const RemoveJsonTextAttribute = (value, parentElement) => {
  try {
    const keyNo = Object.keys(parentElement._parent).length;
    const keyName = Object.keys(parentElement._parent)[keyNo - 1];
    parentElement._parent[keyName] = value;
  } catch (e) {
    console.error(e);
  }
};

// 공연 정보 db에 저장하는 로직
export const postShow = async (req, res, next) => {
  try {
    const { page, code, shprfnmfct } = req.query;

    const baseUrl = `http://www.kopis.or.kr/openApi/restful/pblprfr?service=${process.env.OPENAPI_SECRET_KEY}&stdate=20180101&eddate=20211231&rows=50`;

    const config = {
      cpage: page,
      shcate: code,
      shprfnmfct,
    };

    const params = new URLSearchParams(config).toString();
    const finalUrl = `${baseUrl}&${params}`;

    const { data } = await axios.get(finalUrl);
    const jsonData = convert.xml2json(data, {
      compact: true,
      spaces: 4,
      textFn: RemoveJsonTextAttribute,
    });

    const obj = JSON.parse(jsonData);
    const result = [];

    const showObj = obj.dbs.db;

    console.log(showObj.length);
    // console.log(showObj);

    // poster 정보 없을 경우 string null로 저장
    showObj.forEach((data2) => {
      if (typeof data2.poster === "object") {
        data2.poster = "null";
      }

      const show = new Show(data2);
      result.push(show);
    });

    await Show.insertMany(result);

    const show = new Show(showObj);
    await show.save();

    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};
