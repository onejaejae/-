import axios from "axios";
import convert from "xml-js";
import mongoose from "mongoose";
import Show from "../models/Show";
import Theater from "../models/Theater";
import User from "../models/User";
import throwError from "../utils/throwError";
import Review from "../models/Review";

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

    const baseUrl = `http://www.kopis.or.kr/openApi/restful/pblprfr?service=${process.env.OPENAPI_SECRET_KEY}&stdate=20180101&eddate=20211231&rows=300`;

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
    const showObj = obj.dbs.db;

    console.log(showObj.length);
    // console.log(showObj);

    const theater = [
      "블루스퀘어 (신한카드홀(구. 인터파크홀))",
      "충무아트센터 (대공연장)",
      "샤롯데씨어터 (샤롯데씨어터)",
      "디큐브아트센터 (디큐브씨어터)",
      "두산아트센터 (연강홀)",
      "홍익대 대학로 아트센터 (대극장)",
      "LG아트센터 (LG아트센터)",
      "예술의전당 (CJ 토월극장)",
      "예술의전당 (오페라극장)",
      "세종문화회관 (대극장)",
    ];

    showObj.map(async (data2) => {
      try {
        const showId = data2.mt20id;
        const showData = await axios.get(
          `http://www.kopis.or.kr/openApi/restful/pblprfr/${showId}?service=${process.env.OPENAPI_SECRET_KEY}`
        );

        const showjsonData = convert.xml2json(showData.data, {
          compact: true,
          spaces: 4,
          textFn: RemoveJsonTextAttribute,
        });

        const obj2 = JSON.parse(showjsonData);
        const showObj2 = obj2.dbs.db;

        if (theater.includes(showObj2.fcltynm)) {
          let cast = [];
          let crew = [];
          let seguidance = [];
          let dtguidance = [];
          const styurls = [];

          if (typeof showObj2.prfcast !== "object") {
            cast = showObj2.prfcast.split(",");
            cast[cast.length - 1] = cast[cast.length - 1].replace(" 등", "");
          }

          if (typeof showObj2.prfcrew !== "object") {
            crew = showObj2.prfcrew.split(",");
            crew[crew.length - 1] = crew[crew.length - 1].replace(" 등", "");
          }

          if (typeof showObj2.pcseguidance !== "object") {
            seguidance = showObj2.pcseguidance.split("원");
            seguidance.forEach((guidance, index) => {
              seguidance[index] = guidance.replace(", ", "");
              seguidance.splice(seguidance.length - 1);
            });
          }

          if (typeof showObj2.dtguidance !== "object") {
            dtguidance = showObj2.dtguidance.split(")");
            dtguidance.splice(dtguidance.length - 1);
            dtguidance.forEach((guidance, index) => {
              dtguidance[index] = guidance.replace(", ", "");
              dtguidance[index] += ")";
            });
          }

          if (showObj2.styurls !== {}) {
            for (const property in showObj2.styurls) {
              styurls.push(showObj2.styurls[property]);
            }
          }

          const variable = {
            mt20id: showObj2.mt20id,
            prfnm: showObj2.prfnm,
            prfpdfrom: showObj2.prfpdfrom,
            prfpdto: showObj2.prfpdto,
            fcltynm: showObj2.fcltynm,
            poster: typeof showObj2.poster === "object" ? "" : showObj2.poster,
            genrenm: showObj2.genrenm,
            prfstate: showObj2.prfstate,
            openrun: showObj2.openrun,
            prfage: showObj2.prfage,
            prfruntime:
              typeof showObj2.prfruntime === "object"
                ? ""
                : showObj2.prfruntime,
            prfcast: cast,
            prfcrew: crew,
            pcseguidance: seguidance,
            entrpsnm:
              typeof showObj2.entrpsnm === "object" ? "" : showObj2.entrpsnm,
            sty: typeof showObj2.sty === "object" ? "" : showObj2.sty,
            dtguidance,
            styurls,
          };

          const show = new Show(variable);
          await show.save();
        }
      } catch (error) {
        console.error(error);
      }
    });

    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const getShow = async (req, res, next) => {
  try {
    const { genrenm, page = 0, sort, type } = req.query;

    if (!genrenm) {
      return next(throwError(400, "query에 genrenm이 없습니다."));
    }
    let shows;

    if (genrenm === "연극" && type) {
      const findVariable =
        type === "open" ? { genrenm, openrun: "Y" } : { genrenm, openrun: "N" };
      let sortVariable = { prfnm: 1 };

      switch (sort) {
        case "name":
          sortVariable = { prfnm: 1 };
          break;
        case "latest":
          sortVariable = { prfpdfrom: -1 };
          break;
        case "rating":
          sortVariable = { rating: -1, prfnm: 1 };
          break;

        default:
          break;
      }

      shows = await Show.find(findVariable, {
        scraps: 0,
        __v: 0,
        updatedAt: 0,
        createdAt: 0,
      })
        .sort(sortVariable)
        .skip(page * 10)
        .limit(10);
    } else {
      let variable = { prfnm: 1 };
      switch (sort) {
        case "name":
          variable = { prfnm: 1 };
          break;
        case "latest":
          variable = { prfpdfrom: -1 };
          break;
        case "rating":
          variable = { rating: -1, prfnm: 1 };
          break;

        default:
          break;
      }

      shows = await Show.find(
        { genrenm },
        { scraps: 0, __v: 0, updatedAt: 0, createdAt: 0 }
      )
        .sort(variable)
        .skip(page * 10)
        .limit(10);
    }

    res.status(200).json({ success: true, data: shows });
  } catch (error) {
    next(error);
  }
};

export const getShowDetail = async (req, res, next) => {
  try {
    const { showId } = req.params;
    const { page = 0 } = req.query;

    if (!mongoose.isValidObjectId(showId))
      return next(throwError(400, "showId가 유효하지 않습니다."));

    const show = await Show.findById(showId, { scraps: 0 });
    const review = await Review.find({ mt20id: show.mt20id })
      .skip(page * 10)
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({ success: true, data: { show, review } });
  } catch (error) {
    next(error);
  }
};

export const getSearchShow = async (req, res, next) => {
  try {
    const { term, page = 0, sort } = req.query;
    let variable = { prfnm: 1 };
    if (sort) {
      switch (sort) {
        case "name":
          variable = { prfnm: 1 };
          break;
        case "latest":
          variable = { prfpdfrom: -1 };
          break;
        case "rating":
          variable = { rating: -1, prfpdfrom: -1 };
          break;
        default:
          return next(
            throwError(400, "sort key값의 value 값이 올바르지 않습니다.")
          );
      }
    }
    const show = await Show.find(
      {
        genrenm: "연극",
        prfnm: { $regex: term, $options: "i" },
      },
      { scraps: 0 }
    )
      .sort(variable)
      .skip(page * 10)
      .limit(10);
    res.status(200).json({ success: true, data: show });
  } catch (error) {
    next(error);
  }
};

export const getSearchMusical = async (req, res, next) => {
  try {
    const { term, page = 0, sort } = req.query;

    let variable = { prfnm: 1 };
    if (sort) {
      switch (sort) {
        case "name":
          variable = { prfnm: 1 };
          break;
        case "latest":
          variable = { prfpdfrom: -1 };
          break;
        case "rating":
          variable = { rating: -1, prfpdfrom: -1 };
          break;

        default:
          return next(
            throwError(400, "sort key값의 value 값이 올바르지 않습니다.")
          );
      }
    }

    const musical = await Show.find(
      {
        genrenm: "뮤지컬",
        prfnm: { $regex: term, $options: "i" },
      },
      { scraps: 0 }
    )
      .sort(variable)
      .skip(page * 10)
      .limit(10);

    res.status(200).json({ success: true, data: musical });
  } catch (error) {
    next(error);
  }
};

export const getSearchTheater = async (req, res, next) => {
  try {
    const { term, page = 0 } = req.query;
    const theater = await Theater.find({
      name: { $regex: term, $options: "i" },
    })
      .skip(page * 10)
      .limit(10);

    res.status(200).json({ success: true, data: theater });
  } catch (error) {
    next(error);
  }
};

export const patchScrap = async (req, res, next) => {
  try {
    const { showId } = req.params;
    if (!mongoose.isValidObjectId(showId)) {
      return next(throwError(400, "showId가 유효하지 않습니다."));
    }

    const [user] = await Promise.all([
      User.findByIdAndUpdate(
        req.id,
        {
          $push: { scrapShow: { $each: [showId], $slice: -10 } },
        },
        { new: true }
      ),
      Show.findByIdAndUpdate(
        showId,
        {
          $push: {
            scraps: { userId: req.id, createAt: Date.now() },
          },
        },
        { new: true }
      ),
    ]);

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

export const patchUnScrap = async (req, res, next) => {
  try {
    const { showId } = req.params;
    if (!mongoose.isValidObjectId(showId)) {
      return next(throwError(400, "showId가 유효하지 않습니다."));
    }

    const [user] = await Promise.all([
      User.findByIdAndUpdate(req.id, {
        $pull: { scrapShow: showId },
      }),
      Show.findByIdAndUpdate(showId, {
        $pull: { scraps: { userId: req.id } },
      }),
    ]);

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};
