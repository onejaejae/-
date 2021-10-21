import fetch from "node-fetch";

const tokenApi = async (baseUrl, accessToken = null) => {
  try {
    let data;

    if (accessToken) {
      data = await fetch(baseUrl, {
        method: "get",
        headers: {
          "Content-type": "application/x-www-form-urlencoded;charset=utf-8",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      return data;
    } else {
      data = await fetch(baseUrl, {
        method: "get",
      });

      return data;
    }
  } catch (error) {
    console.error(error);
  }
};

export default tokenApi;
