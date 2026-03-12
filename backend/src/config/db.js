const { Sequelize } = require('sequelize');
const pg = require('pg'); // Force import at top level for bundlers

let sequelize;

const getSequelize = () => {
  if (sequelize) return sequelize;

  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL is missing!');
    // Use a placeholder to prevent crashes, but it won't connect
    sequelize = new Sequelize('postgres://localhost:5432/dummy', {
      dialect: 'postgres',
      dialectModule: pg,
      logging: false
    });
    return sequelize;
  }

  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectModule: pg, // CRITICAL FIX for Vercel/Serverless
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    logging: false
  });

  return sequelize;
};

const connectDB = async () => {
  const instance = getSequelize();
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not defined.');
  }
  try {
    await instance.authenticate();
    console.log('PostgreSQL Connected');
  } catch (error) {
    console.error(`PostgreSQL Connection Error: ${error.message}`);
    // Do not process.exit(1) in serverless environments as it causes 500 errors
    throw error;
  }
};

// Export a proxy or a getter-based object to ensure models get the instance when they need it
module.exports = {
  get sequelize() { return getSequelize(); },
  connectDB
};
