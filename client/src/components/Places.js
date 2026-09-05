import React, { Component } from 'react'
import connect from './connector'

class Places extends Component {
    constructor(props) {
        super(props)
        this.placesRef = React.createRef()
        this.autocompleteService = { current: null }
    }

    componentDidMount() {
        if (!this.autocompleteService.current && window.google) {
            this.autocompleteService.current = new window.google.maps.places.AutocompleteService();
        }
        this.initGooglePlaces();
    }

    initGooglePlaces = () => {
        try {
            const input = this.placesRef.current;
            const autocomplete = new window.google.maps.places.Autocomplete(input, {
                types: ['address'],
                componentRestrictions: { country: 'us' }
            });

            autocomplete.addListener('place_changed', () => {
                const place = autocomplete.getPlace();
                if (place.formatted_address) {
                    this.props.search({ 
                        address: place.formatted_address,
                        lat: place.geometry?.location?.lat() || 40.7128,
                        long: place.geometry?.location?.lng() || -74.0060
                    });
                }
            });
        } catch (error) {
            console.error('Error initializing Google Places:', error);
        }

        this.keepInputEnabled();
    }

    keepInputEnabled = () => {
        window.setTimeout(() => {
            const input = this.placesRef.current;

            if (input?.disabled) {
                input.disabled = false;
                input.removeAttribute('disabled');
            }
        }, 250);
    }

    handleKeyDown = (event) => {
        if (event.key !== 'Enter') {
            return;
        }

        event.preventDefault();
        const address = this.placesRef.current?.value?.trim();

        if (!address) {
            return;
        }

        this.props.search({
            address,
            lat: 40.7128,
            long: -74.0060
        });
    }

    render() {
        return (
            <div className="places-search">
                <input 
                    ref={this.placesRef} 
                    type="search" 
                    id="address-input" 
                    placeholder="Enter your address"
                    onKeyDown={this.handleKeyDown}
                />
            </div>
        )
    }
}

export default connect(Places)
