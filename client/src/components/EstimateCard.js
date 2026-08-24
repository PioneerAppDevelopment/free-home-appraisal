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
  const {id, site_name, img, link, sourceStatus} = props.data;
  const statusClassName = sourceStatus === 'Included'
    ? 'source-status-pill included'
    : 'source-status-pill checked';

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
              {sourceStatus || 'Checked'}
              </Typography>  
              <span className={statusClassName}>
                {sourceStatus === 'Included' ? 'Estimate found' : 'Source checked'}
              </span>
          </CardContent>
        </CardActionArea>
        <CardActions>
          <Button size="small" color="primary" onClick={(e) => props.toggleEstimate(e, id)}>
            <small>Remove Source</small>
          </Button>
          {link ? (
            <Button className="link-btn" size="small" color="primary" href={link} target="_blank">
              <ExitToAppIcon />
            </Button>
          ) : null}
        </CardActions>
      </Card>
    );
}
