import React, { Component } from 'react';
import GoogleMapReact from 'google-map-react';
import MapMarker from './MapMarker';


class Map extends Component {
  
  static defaultProps = {
    zoom: 16
  };
  
  render() {
    return (
      <div className="property-map">
        <GoogleMapReact
          bootstrapURLKeys={{
            key: `${process.env.REACT_APP_GOOGLE_MAP_API_KEY}`
          }}
          center={{ lat: Number(this.props.lat), lng: Number(this.props.long) }}
          defaultZoom={this.props.zoom}
        >
          <MapMarker
            lat={this.props.lat}
            lng={this.props.long}
            text="My Marker"
          />
        </GoogleMapReact>
      </div>
    );
  }
}
 
export default Map;
