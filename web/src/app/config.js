export const location = process.env.MODE || "development";

const apiLocations = {
  production: "https://api.duckbo.at",
  development: "http://localhost:5000",
};
export const apiLocation = apiLocations[location];

const avatarLocations = {
  production: "https://avatars.duckbo.at",
  development: "http://localhost:5000/static/avatars",
};
export const avatarLocation = avatarLocations[location];

const imageLocations = {
  production: "https://images.duckbo.at",
  development: "http://localhost:5000/static/images",
};
export const imagesLocation = imageLocations[location];
