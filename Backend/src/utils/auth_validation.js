const validator = require("validator");
const auth_validate = (data) => {
  const mandatoryField = [
    "firstName",
    "lastName",
    "password",
    "emailId",
    "age",
    "gender",
  ];
  const isAllowed = mandatoryField.every((k) => Object.keys(data).includes(k));
  if (!isAllowed) throw new Error("Required field missing");

  if (!validator.isEmail(data.emailId)) throw new Error("Invalid Email");
  if (!validator.isStrongPassword(data.password))
    throw new Error("Enter strong password");

  if (data.firstName.length < 3 || data.firstName.length > 20)
    throw new Error("Enter valid name");

  if (data.lastName.length < 1 || data.lastName.length > 20)
    throw new Error("Enter valid last name");

  if (data.age < 13 || data.age > 120) throw new Error("Enter valid age");

  if (!["male", "female", "other"].includes(data.gender))
    throw new Error("Invalid gender");
};

module.exports = auth_validate;
