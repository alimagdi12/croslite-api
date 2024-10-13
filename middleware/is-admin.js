const jwt = require("jsonwebtoken");


module.exports =async (req, res, next) => {
    
    const token = await req.cookies.token;
    const decodedToken = await jwt.verify(token, "your_secret_key");
    const email = decodedToken.email;

    if (!token || !decodedToken  || email !== 'alimagdi12367@gmail.com') {
        return res.redirect('/login');
    }
    next();
}
