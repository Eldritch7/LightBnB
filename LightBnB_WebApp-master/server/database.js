const properties = require('./json/properties.json');
const users = require('./json/users.json');

//Added pg
const { Pool } = require('pg');

const pool = new Pool({
  user: 'labber',
  password: 'labber',
  host: 'localhost',
  database: 'lightbnb'
});

pool.query(
  `SELECT title FROM properties LIMIT 10;`).then(response => {
  console.log(response);
});

/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */


 const getUserWithEmail = (email) => {
  return pool
    .query(`SELECT * FROM users WHERE email = $1`, [email])
    .then((result) => {
      //console.log(result.rows);
      if (result.rows) {
        return result.rows[0];
      } else {
        return null;
      }
      
    })
    .catch((err) => {
      console.log(err.message);
    });
};

 exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
 const getUserWithId = (id) => {
  return pool
    .query(`SELECT * FROM users WHERE id = $1`, [id])
    .then((result) => {
      //console.log(result.rows);
      if (result.rows) {
        return result.rows[0];
      } else {
        return null;
      }
      
    })
    .catch((err) => {
      console.log(err.message);
    });
};
// const getUserWithId = function(id) {
//   return Promise.resolve(users[id]);
// }
exports.getUserWithId = getUserWithId;


/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */

const addUser = (user) => {
  return pool
  .query(`INSERT INTO users (name, email, password)
  VALUES ($1, $2, $3)
  RETURNING *`, [user.name, user.email, user.password])
  .then(result => {
    return result.rows[0];
  })
  .catch((err) => {
    console.log(err.message);
  });
};

exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = (guestId, limit=10) => {
  return pool
  .query(`SELECT properties.*, reservations.*, AVG(property_reviews.rating) AS average_rating
  FROM reservations JOIN properties 
  ON reservations.property_id = properties.id 
  JOIN property_reviews
  ON properties.id = property_reviews.property_id
  WHERE reservations.guest_id = $1
  GROUP BY properties.id, reservations.id
  ORDER BY reservations.start_date ASC
  LIMIT $2;`, [guestId, limit])
  .then((result) => {
    console.log('new function', result.rows);
    return result.rows;
  })
  .catch((err) => {
    console.log(err.message);
  });
};
// const getAllReservations = function(guest_id, limit = 10) {
//   return getAllProperties(null, 2);
// }
exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */



const getAllProperties = function (options, limit = 10) {
  // 1 - array to hold any parameter that may be avalible for the query
  const queryParams = [];
  // 2 start the query with all information that comes before the WHERE clause.
  let queryString = `
  SELECT properties.*, avg(property_reviews.rating) as average_rating
  FROM properties
  JOIN property_reviews ON properties.id = property_id
  `;

  // 3 Check if a city has been passed in as an option.
  // Add the city to the params array and create a WHERE clause for the city.
  if (options.city) {
    queryParams.push(`%${options.city}%`);
    //We can use the length of the array to dynamically get the $n 
    //placeholder number. Since this is the first parameter, it will be $1.
    queryString += `WHERE city LIKE $${queryParams.length} `;
  }
//Check if there's an owner id and add a filter (AND or WHERE depending on how the )
  if (options.owner_id) {
    queryParams.push(options.owner_id);
    if (queryParams.length === 1) {
      queryString += `WHERE owner_id = $${queryParams.length}`;
    } else {
      queryString += `AND owner_id = $${queryParams.length}`;
    }
  }
  if (options.minimum_price_per_night && options.maximum_price_per_night) {
    queryParams.push((options.minimum_price_per_night * 100), (options.maximum_price_per_night * 100));
    if (queryParams.length === 2) {
      queryString += `WHERE cost_per_night >= $${queryParams.length - 1} AND cost_per_night <= $${queryParams.length}`;
    } else {
      queryString += `AND cost_per_night >= $${queryParams.length - 1} AND cost_per_night <= $${queryParams.length}`;
   

    }
  }

  // 4 Add any query that comes after the WHERE clause
 
  queryString += `
  GROUP BY properties.id `;

  if (options.minimum_rating) {
    queryParams.push(options.minimum_rating);
    queryString += `
    HAVING avg(property_reviews.rating) >= $${queryParams.length}`;
  }

  queryParams.push(limit);
  queryString += `
  ORDER BY cost_per_night
  LIMIT $${queryParams.length}`;

 

  // 5 Console log everything just to make sure we've done it right.
  console.log(queryString, queryParams);

  // 6 Run the query.
  return pool.query(queryString, queryParams).then((res) => res.rows);
};

exports.getAllProperties = getAllProperties;


/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */

 const addProperty = (property) => {
  return pool
  .query(`INSERT INTO properties (
    owner_id,
    title,
    description,
    thumbnail_photo_url,
    cover_photo_url,
    cost_per_night,
    street,
    city,
    province,
    post_code,
    country,
    parking_spaces,
    number_of_bathrooms,
    number_of_bedrooms
  )
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
  RETURNING *`, [
      property.owner_id,
      property.title,
      property.description,
      property.thumbnail_photo_url,
      property.cover_photo_url,
      property.cost_per_night,
      property.street,
      property.city,
      property.province,
      property.post_code,
      property.country,
      property.parking_spaces,
      property.number_of_bathrooms,
      property.number_of_bedrooms
  ])
  .then(result => {
    return result.rows[0];
  })
  .catch((err) => {
    console.log(err.message);
  });
};


// const addProperty = function(property) {
//   const propertyId = Object.keys(properties).length + 1;
//   property.id = propertyId;
//   properties[propertyId] = property;
//   return Promise.resolve(property);
// }
exports.addProperty = addProperty;
