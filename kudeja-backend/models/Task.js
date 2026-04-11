module.exports = (sequelize, DataTypes) => {
  const Task = sequelize.define('Task', {
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
    },
    status: {
      type: DataTypes.ENUM('pending', 'in_progress', 'completed'),
      defaultValue: 'pending',
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high'),
      defaultValue: 'medium',
    },
    due_date: {
      type: DataTypes.DATEONLY,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users', // assuming the table name for the User model is 'Users'
        key: 'id',
      },
    },
  }, {
    tableName: 'tasks',
    timestamps: true, // adds createdAt and updatedAt
  });

  Task.associate = function(models) {
    Task.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
    });
  };

  return Task;
};