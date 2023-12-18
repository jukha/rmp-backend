import bcrypt from "bcryptjs";

export const hashPassword = async (password) => {
  if (!password) {
    return false;
  }
  const hash = await bcryptHash(password);
  return hash;
};

const bcryptHash = (password) =>
  new Promise((resolve, reject) => {
    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(password, salt, (err, hash) => {
        if (err) {
          reject(err);
        } else {
          resolve(hash);
        }
      });
    });
  });

export const comparePassword = async (password, hashedPassword) => {
  if (!password) {
    return false;
  }
  const isMatch = await bcryptCompare(hashedPassword,password);
  return isMatch;
};

const bcryptCompare = (hashedPassword, password) =>
  new Promise((resolve, reject) => {
    bcrypt.compare(password, hashedPassword, (err, res) => {
      if (err) {
        reject(err);
      } else {
        resolve(res);
      }
    });
  });
