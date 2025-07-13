module.exports = (sequelize, DataTypes) => {
  const Message = sequelize.define("Message", {
    username: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    system: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  });

  return Message;
};
