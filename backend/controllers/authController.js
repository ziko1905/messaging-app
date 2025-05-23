const { body, validationResult } = require("express-validator");
const queries = require("../db/queries");
const { customIsAlpha, hasGlobalAlpha } = require("fix-esm").require(
  "../../common/utils/customIsAlpha"
);
const isContainingCallback = require("../utils/isContainingCallback");
const validator = require("validator");
const bcrypt = require("bcrypt");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const {
  getBaseEmailVC,
  getBaseUsernameVC,
} = require("../utils/baseValidationChains");
const validateBodyProps = require("../middleware/validateBodyProps");
const { JWT_EXPIRES_IN } = require("../utils/constants");

const validateUser = [
  getBaseUsernameVC(),
  body("firstName").custom(customIsAlpha("First Name")),
  body("lastName").custom(customIsAlpha("Last Name")),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must contain at least 8 characters")
    .custom(
      isContainingCallback(
        // better than using matchers bcs it includes all uppercase letters (not only from A - Z)
        "uppercase letter",
        validator.isUppercase,
        hasGlobalAlpha
      )
    )
    .custom(
      isContainingCallback(
        "lowercase letter",
        validator.isLowercase,
        hasGlobalAlpha
      )
    )
    .custom(isContainingCallback("number", validator.isNumeric))
    // eslint-disable-next-line no-useless-escape
    .matches(/[-!$%@^&*()_+|~=`{}\[\]:";'<>?,.\/]/)
    .withMessage("Password must contain at least one symbol"),
  getBaseEmailVC(),
];

const userPostBodyProps = [
  "username",
  "firstName",
  "lastName",
  "password",
  "email",
];

module.exports.userPost = (ImageManager) => {
  return [
    validateUser,
    async (req, res, next) => {
      if (req.body.pictureBase64 && !req.body.pictureBase64.includes(","))
        return res.status(422).send({
          error: "Provided picture string isn't in data URI base64 format",
        });

      next();
    },
    validateBodyProps(userPostBodyProps),
    async (req, res) => {
      const validationErrors = validationResult(req);
      if (!validationErrors.isEmpty()) {
        return res
          .status(422)
          .send({ message: validationErrors.array().map((err) => err.msg) });
      }

      const userData = { ...req.body };
      delete userData.pictureBase64;
      userData.password = bcrypt.hashSync(
        req.body.password,
        bcrypt.genSaltSync()
      );

      const photoPublicId = req.body.pictureBase64
        ? await ImageManager.uploadCropped(req.body.pictureBase64)
        : null;

      if (photoPublicId) {
        userData.photoPublicId = photoPublicId;
      }

      await queries.createUser(userData);

      res.status(200).send();
    },
  ];
};

module.exports.loginPost = [
  (req, res, next) => {
    passport.authenticate("local", { session: false }, (err, user, info) => {
      if (err) {
        next(err);
      }
      if (!user) {
        return res.status(401).send({ messages: [info.message] });
      }

      req.user = user;
      next();
    })(req, res, next);
  },
  (req, res) => {
    res.status(200).send({
      token: jwt.sign({ sub: req.user.id }, process.env.JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
      }),
      user: req.user,
    });
  },
];

module.exports.validatePost = [
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    res.send({ user: req.user });
  },
];
