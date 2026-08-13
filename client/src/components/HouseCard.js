import React from 'react';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import StarBorderIcon from "@mui/icons-material/StarBorder";
// import StarIcon from '@mui/icons-material/Star';
import Map from './Map';

// require('dotenv').config();

function numberWithCommas(x) {
  if (x !== undefined) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }
}

const token = process.env.REACT_APP_GOOGLE_MAP_API_KEY;

export default function HouseCard(props) {
    const { home_type, year_built, sqft, lot_size, total_rooms, bedrooms, bathrooms, street_address, city, state, zip_code, sold_price, sold_date, pool, fireplace, parking, garage, washerdryer, link_to, lat, long } = props.home
    const { propStatus, heating, cooling, description } = props.extraHomeData
    //  console.log(`https://maps.googleapis.com/maps/api/streetview?size=1200x1200&fov=60&location=${street_address.split(' ').join('+')},${city.split(' ').join('+')},${state.split(' ').join('+')}&key=${token}`)
    return (
      <div className="house-card">
        <Card className="property-card">
          <CardActionArea>
            <CardMedia
              component="img"
              className="property-card-media"
              image={`https://maps.googleapis.com/maps/api/streetview?size=1200x1200&fov=60&location=${street_address.split(' ').join('+')},${city.split(' ').join('+')},${state.split(' ').join('+')}&key=${token}`}
              title="House Info"
            />
            <div style={{ position: "absolute", top: 10, right: 10 }}>
              <StarBorderIcon
                className="star-home-overlay"
                style={{ fontSize: 50 }}
              />
            </div>
            <CardContent>
              <h1 style={{fontSize: 35, paddingBottom: 20}}>
                {street_address}, {city}, {state} {zip_code}
              </h1>
              <div className="main">
                <Map
                  lat={lat}
                  long={long}
                />
                <div className="home-info">
                  <div className="left">
                    <h1>Home Info</h1>
                    <Typography
                      variant="body2"
                      color="textSecondary"
                      component="span"
                    >
                      <p>
                        <strong>Home Type:</strong> {home_type || "N/A"}
                      </p>
                      <p>
                        <strong>Year Built:</strong> {year_built || "N/A"}
                      </p>
                      <p>
                        <strong>Size:</strong> {sqft ? numberWithCommas(sqft) + " /sqft" : "N/A"}
                      </p>
                      <p>
                        <strong>Lot Size:</strong>{" "}
                        {lot_size ? numberWithCommas(lot_size) + " /sqft" : "N/A"}
                      </p>
                      <p>
                        <strong>Total Rooms:</strong> {total_rooms || "N/A"}
                      </p>
                      <p>
                        <strong>Bedrooms:</strong> {bedrooms || "N/A"}
                      </p>
                      <p>
                        <strong>Bathrooms:</strong> {bathrooms || "N/A"}
                      </p>
                    </Typography>
                    
                  </div>
                  <div className="right">
                    <h1>Status</h1>
                    <Typography
                      variant="body2"
                      color="textSecondary"
                      component="span"
                    >
                      <p>
                        <strong>Last Sold Date:</strong> {sold_date || "N/A"}
                      </p>
                      <p>
                        <strong>Last Sold Price:</strong>{" "}
                        {sold_price ? "$" + numberWithCommas(sold_price) : "N/A"}
                      </p>
                      <p>
                        <strong>Status:</strong>{" "}
                        {propStatus || "N/A"}
                      </p>
                    </Typography>
                    <h1>Amenities</h1>
                    <Typography
                      variant="body2"
                      color="textSecondary"
                      component="span"
                    >
                      <p>
                        <strong>Garage:</strong> {garage || "N/A"}
                      </p>
                      <p>
                        <strong>Parking:</strong> {parking || "N/A"}
                      </p>
                      <p>
                        <strong>Heating:</strong> {heating || "N/A"}
                      </p>
                      <p>
                        <strong>Air Conditioning:</strong> {cooling || "N/A"}
                      </p>
                      <p>
                        <strong>Pool:</strong> {pool || "N/A"}
                      </p>
                      <p>
                        <strong>Fireplace:</strong> {fireplace || "N/A"}
                      </p>
                      <p>
                        <strong>Washer/Dryer:</strong> {washerdryer || "N/A"}
                      </p>
                    </Typography>
                  </div>
                </div>
              </div>
              {description ?
              <div className="description-box">
                <h2>Description</h2>
                  <Typography
                    variant="body2"
                    color="textSecondary"
                    component="span"
                  >
                    {description}
                  </Typography>
              </div>
              : null}
            </CardContent>
          </CardActionArea>
          <CardActions className="house-actions">
            <Button size="small" color="primary" href={link_to}>
              View on Zillow
            </Button>
            <Button size="small" color="primary">
              View Additional Photos
            </Button>
            <Button size="small" color="primary">
              <StarBorderIcon />
            </Button>
          </CardActions>
        </Card>
      </div>
    );
}
