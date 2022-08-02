const express = require("express");
const cookieParser = require("cookie-parser");
//db eq
const authtokens = {};
const usersData = [];
const app = express();
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
//admin protected route

app.get("/user-login", (req, res) => {
  res.send({
    message: "already registerd, please login",
  });
});
app.post("/login", (req, res) => {
  const { username, mobile } = req.body;
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  const userAgent = req.headers["user-agent"];
  const token = req.cookies["token"];
  if (token) {
    res.send({
      message: "already logged in",
    });
  } else {
    //check if user exists
    const user = usersData.find(
      (user) => user.user_name === username && user.mobile_number === mobile
    );
    if (user) {
      const curAuthKey = Object.keys(authtokens).find((authKey) => {
        return (
          authtokens[authKey].mobile_number === mobile &&
          authtokens[authKey].user_name === username
        );
      });
      //remove authtoken from server and end the session
      delete authtokens[curAuthKey];

      const newSession = `${new Date()}${username}`;
      user.ip = ip;
      user["user-agent"] = userAgent;
      user.active_session = newSession;
      user.sessions.push({ session: newSession });
      const newAuthtoken = `${Math.random()}${username}`;
      authtokens[newAuthtoken] = user;
      res.cookie("token", newAuthtoken);
      res.redirect(`/doGetUser?mobile=${mobile}`);
    } else {
      res.send({
        error: true,
        message: "user not found, please register yourself ",
      });
    }
  }
});

app.get("/doGetUser", (req, res) => {
  let { mobile } = req.query;
  mobile = mobile ? parseInt(mobile) : null;
  const token = req.cookies["token"];
  const curUser = authtokens[token];
  if (curUser) {
    const userData = usersData.find((user) => user.mobile_number === mobile);
    if (userData) {
      res.send({
        error: false,
        payload: userData,
      });
    } else {
      res.send({
        error: true,
        payload: {
          message: "no registered user",
        },
      });
    }
  } else {
    res.clearCookie("token");
    res.send({
      error: true,
      message:
        "there is already session up and running, please logout there and login again",
    });
  }
});
//user details
// {
//     mobile_number: 263728 ,
//     user_name: "agva",
//    ip,
//user-agent
//     active_session:"ahgha" ,
//     sessions: []
// }
app.post("/createUser", (req, res) => {
  let { mobile, username } = req.body;
  mobile = mobile ? parseInt(mobile) : null;
  //add later sanitization
  //and check if sanitized values have error then send error message
  const user = usersData.find(
    (user) => user.user_name === username && user.mobile_number === mobile
  );
  if (!user) {
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const userAgent = req.headers["user-agent"];
    const sessionId = `${new Date()}${username}`;
    //save user details database
    const sessions = [];
    sessions.push({ session: sessionId });
    userData = {
      mobile_number: mobile,
      user_name: username,
      ip,
      user_agent: userAgent,
      active_Session: sessionId,
      sessions,
    };
    usersData.push(userData);
    const newAuthtoken = `${Math.random()}${username}`;
    authtokens[newAuthtoken] = userData;
    res.cookie("token", newAuthtoken);
    res.redirect(`/doGetUser?mobile=${mobile}`);
  } else {
    res.redirect("/user-login");
  }
});

//get all user details --params
app.get("/all-users", (req, res) => {
  //for admin  
    const { username, password } = req.query;
    if (username == "admin" && password == "password") {
      //controlller call
      res.send({
        error: false,
        payload: usersData,
      });
    } else {
      res.send({
        error: true,
        message: "invaid user",
      });
    }
  
});

app.listen(process.env.PORT || 3000, () => {
  console.log("hello");
});
