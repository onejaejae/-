### JWT 구현

---

<br>

https://velog.io/@kshired/Express%EC%97%90%EC%84%9C-JWT%EB%A1%9C-%EC%9D%B8%EC%A6%9D%EC%8B%9C%EC%8A%A4%ED%85%9C-%EA%B5%AC%ED%98%84%ED%95%98%EA%B8%B0-Access-Token%EA%B3%BC-Refresh-Token

<br>

### best practice

---

<br>

https://github.com/goldbergyoni/nodebestpractices#2-error-handling-practices

https://goldbergyoni.com/checklist-best-practices-of-node-js-error-handling/ (오류처리)

<br>

✔ Separate Express 'app' and 'server'

     fast testing execution and getting coverage metrics of the code. It also allows deploying the same API under flexible and different network conditions. Bonus: better separation of concerns and cleaner code.

### production 고려사항

---

<br>

https://expressjs.com/ko/advanced/best-practice-security.html

https://blog.ull.im/engineering/2019/03/31/node-js-production-best-practices.html

<br>

### docker pm2

---

<br>

https://velog.io/@nawnoes/nodejs-express.js-%EC%84%9C%EB%B2%84-babel-node%EC%99%80-pm2%EB%A1%9C-%EA%B8%B0%EB%8F%99%ED%95%98%EA%B8%B0

<br>

### node cluster

---

<br>

https://velog.io/@ckstn0777/NodeJS-%EC%84%B1%EB%8A%A5-%ED%96%A5%EC%83%81-%EB%B0%A9%EB%B2%95-2-PM2

http://labs.brandi.co.kr/2018/05/25/kangww.html

https://engineering.linecorp.com/ko/blog/pm2-nodejs/

<br>

### winson daily rotate

---

<br>

실서비스 구현 시 log를 daily별로 관리하는 것이 바람직하므로 daily rotate 라이브러리 사용 권장

https://velog.io/@broccoliindb/winston-%EA%B3%BC-winston-daily-rotate-file-%EC%82%AC%EC%9A%A9%EB%B2%95

<br>

### docker pm2 cluster

---

<br>

https://loy124.tistory.com/381

https://jaeseokim.tistory.com/115

https://armadillo-dev.github.io/javascript/nodejs/node-js-pm2/

### DB 데이터 복사

---

https://aimb.tistory.com/173

<br>

### pm2 무중단

<br>

---

https://engineering.linecorp.com/ko/blog/pm2-nodejs/

<br>

### atlas mongo dump

---

<br>

https://realwater87.tistory.com/6

ex)

✔ dump

mongodump --uri "mongodb+srv://bogo:PnDlsMx8MvsCP1FC@cluster0.5gwfw.mongodb.net/BOGO"

✔ 복구

mongorestore --uri "mongodb+srv://bogo:PnDlsMx8MvsCP1FC@cluster0.5gwfw.mongodb.net" --db BOGO_TEST ./dump/BOGO

<br>

✔ 견고한 nodeJs 만들기

---

https://velog.io/@hopsprings2/%EA%B2%AC%EA%B3%A0%ED%95%9C-node.js-%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8-%EC%95%84%ED%82%A4%ED%85%8D%EC%B3%90-%EC%84%A4%EA%B3%84%ED%95%98%EA%B8%B0

https://darrengwon.tistory.com/1273

<br>

### cloudFront 캐시 무효화 Issue

---

<br>

https://kiwinam.com/posts/42/remove-cache-cloud-front/

### multer 확장자 처리 Issue

---

<br>

https://hyogeun-android.tistory.com/entry/9-Nodejs-Multer-%EC%9D%B4%EB%AF%B8%EC%A7%80-%EC%97%85%EB%A1%9C%EB%93%9C

---

### traffic 몰릴 시 고려해 볼 것

<br>

https://www.youtube.com/watch?v=_1Yqk-fLkec

https://www.youtube.com/watch?v=s9FHdj6jd_U&t=50

https://www.youtube.com/watch?v=z68l2X5KoC4

<br>

### ForEach async 기다려주지 않는다

---

https://constructionsite.tistory.com/43
