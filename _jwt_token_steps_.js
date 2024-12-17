/**
 * 1. After successful login : generate a JWT Token 
 * npm i jsonwebtoken, cookierParser
 * jwt.sign(payload, secret, {expresIn:'1h'})
 * 
 * 2. send token (generate in the server side) to the client side 
 * local storage(esier)
 * 
 * httpCookieOnly -->  better 
 * 
 * 
 * 3. for sensitive or secure or private protected Apis : send token to the server side 
 *  -- on the server side----
 * app.use(cors({
   origin: ['http://localhost:5173'],
   credentials: true
 
 }))
 * 

        in the client side

        signInuser(email, password)
      .then((result) => {
        console.log("sign in", result.user.email);
        const user = { email: email };
        axios.post("http://localhost:5000/jwt", user,{
          withCredentials: true
        })
          .then(res => {
            console.log(res.data)
          });

          //with credential allow kore dey 
 * 4. validate the toke server side 
 * if valid:provide data
 * if not valid:logOut
 * 
 * 
 * 
 */