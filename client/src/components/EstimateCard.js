import React from "react";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import './EstimateCard.css';
// import { CircularProgress } from "@mui/material";

export default function EstimateCard(props) {
  const {id, site_name, img, link} = props.data;

    return (
      <Card className="estimate-card" data-id={id}>
        <CardActionArea>
          <CardMedia
            component="img"
            className="estimate-card-media"
            image={img}
            title={`${site_name} Estimate`}
          />
          <CardContent>
            <Typography variant="body2" color="textSecondary" component="p">
              {site_name}
          </Typography>
              <Typography gutterBottom variant="h6" component="h2">
              Source Checked
              </Typography>  
              <span className="source-status-pill checked">
                Source checked
              </span>
          </CardContent>
        </CardActionArea>
        {link ? (
          <CardActions>
            <Button className="link-btn" size="small" color="primary" href={link} target="_blank">
              <ExitToAppIcon />
            </Button>
          </CardActions>
        ) : null}
      </Card>
    );
}
