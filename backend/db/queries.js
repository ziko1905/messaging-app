const { PrismaClient } = require("@prisma/client");
const client = new PrismaClient();

module.exports.getUserByUsername = async (username) => {
  return await client.user.findFirst({
    where: {
      username,
    },
  });
};

module.exports.getUserByEmail = async (email) => {
  return await client.user.findFirst({ where: { email } });
};

module.exports.createUser = async (user) => {
  await client.user.create({
    data: {
      ...user,
    },
  });
};

module.exports.getUsersByUsername = async (search) => {
  return await client.user.findMany({
    take: 5,
    where: {
      username: {
        startsWith: search,
      },
    },
  });
};

module.exports.getUserById = async (id) => {
  return await client.user.findFirst({ where: { id } });
};

module.exports.updateUser = async (originalUsername, updatedValues) => {
  return await client.user.update({
    where: { username: originalUsername },
    data: updatedValues,
  });
};
