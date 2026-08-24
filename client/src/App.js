import React, { Component } from 'react';
import './App.css';
import './responsive.css';
import 'typeface-roboto';
import CssBaseline from '@mui/material/CssBaseline';
import NavContainer from './containers/NavContainer';
import Footer from './containers/FooterContainer';
import { Route, Routes } from 'react-router-dom';
import APIContainer from './containers/APIContainer';
import EmptySearchContainer from './containers/EmptySearchContainer';
import LandingPageContainer from './containers/LandingPageContainer';
import NavMenu from './components/NavMenu';
import ProfilePage from './containers/ProfilePage';
import SignUp from './components/SignUp';
import { Element } from 'react-scroll';
import AboutContent from './content/AboutContent';
import ContactContent from './content/ContactContent';
import SellMyHomeContent from './content/SellMyHomeContent';
import LandingPageContent from './content/LandingPageContent';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import PropertyService from './services/api';
import AdminUsageDashboard from './containers/AdminUsageDashboard';
import EstimateLoading from './components/EstimateLoading';
import { buildSourceStatuses } from './utils/estimateSources';

export default class App extends Component {
  state = {
    allHomes: [],
    foundHome: {},
    estimates: {
      zillowEstimate: {
        id: 1,
        site_name: 'Zillow',
        img: './img/zillow-fit.png',
        link: '',
        value: null,
        active: true
      },
      realtorEstimate: {
        id: 2,
        site_name: 'Realtor',
        img: './img/realtor-fit.png',
        listing_id: '',
        link: '',
        value: null,
        active: true
      },
      redfinEstimate: {
        id: 3,
        site_name: 'Redfin',
        img: './img/redfin-fit.png',
        listing_id: '',
        link: '',
        value: null,
        active: true
      },
      melissaEstimate: {
        id: 4,
        site_name: 'Melissa',
        img: './img/melissa-fit.png',
        link: '',
        value: null,
        active: false,
        visible: false
      },
      mashvisorEstimate: {
        id: 5,
        site_name: 'Mashvisor',
        img: './img/mash-fit.png',
        value: null,
        active: false,
        visible: false
      },
      homesEstimate: {
        id: 6,
        site_name: 'Homes.com',
        img: './img/homes-fit.png',
        link: '',
        value: null,
        active: true
      },
      dataTreeEstimate: {
        id: 7,
        site_name: 'Data Tree',
        img: './img/datatree-fit.png',
        value: null,
        active: false,
        visible: false
      },
      estatedEstimate: {
        id: 8,
        site_name: 'Estated',
        img: './img/estated-fit.png',
        value: null,
        active: false,
        visible: false
      },
      attomEstimate: {
        id: 9,
        site_name: 'ATTOM',
        img: './img/attom-fit.svg',
        link: '',
        value: null,
        active: true
      },
      rentcastEstimate: {
        id: 10,
        site_name: 'RentCast',
        img: './img/rentcast-fit.svg',
        link: '',
        value: null,
        active: true
      }
    },
    isLoggedIn: false,
    user: {},
    isLoading: false,
    extraHomeData: {},
    loading: false,
    error: null,
    searchPerformed: false,
    sourceStatuses: []
  };

  handleSearch = async (searchData) => {
    this.setState({ loading: true, sourceStatuses: [] });
    try {
      const [street, city, state, zip] = this.parseAddress(searchData.address);
      const estimates = await PropertyService.getEstimates(street, city, state, zip);
      const homeFacts = estimates.home || {};
      
      this.setState(prevState => ({
        estimates: {
          ...prevState.estimates,
          zillowEstimate: {
            ...prevState.estimates.zillowEstimate,
            value: estimates.zillow?.zestimate || null,
            link: estimates.zillow?.homeDetails || ''
          },
          realtorEstimate: {
            ...prevState.estimates.realtorEstimate,
            value: estimates.realtor?.value || null,
            link: estimates.realtor?.link || ''
          },
          redfinEstimate: {
            ...prevState.estimates.redfinEstimate,
            value: estimates.redfin?.value || null,
            link: estimates.redfin?.link || ''
          },
          melissaEstimate: {
            ...prevState.estimates.melissaEstimate,
            value: estimates.melissa?.value || estimates.melissa?.Records?.[0]?.CurrentDeed?.SalePrice || null
          },
          mashvisorEstimate: {
            ...prevState.estimates.mashvisorEstimate,
            value: estimates.mashvisor?.value || null
          },
          homesEstimate: {
            ...prevState.estimates.homesEstimate,
            value: estimates.homes?.value || estimates.realtyMole?.price || null,
            link: estimates.homes?.link || estimates.realtyMole?.listingUrl || ''
          },
          attomEstimate: {
            ...prevState.estimates.attomEstimate,
            value: estimates.attom?.value || null,
            link: estimates.attom?.link || ''
          },
          rentcastEstimate: {
            ...prevState.estimates.rentcastEstimate,
            value: estimates.rentcast?.value || null,
            link: estimates.rentcast?.link || ''
          }
        },
        foundHome: {
          street_address: street,
          city: city,
          state: state,
          zip_code: zip,
          home_type: homeFacts.home_type || '',
          bedrooms: homeFacts.bedrooms || estimates.melissa?.Records?.[0]?.BuildingInfo?.TotalBedrooms || '3',
          bathrooms: homeFacts.bathrooms || estimates.melissa?.Records?.[0]?.BuildingInfo?.TotalBathrooms || '2',
          sqft: homeFacts.sqft || estimates.melissa?.Records?.[0]?.BuildingInfo?.TotalSquareFeet || '2,000',
          lot_size: homeFacts.lot_size || '',
          year_built: homeFacts.year_built || estimates.melissa?.Records?.[0]?.BuildingInfo?.YearBuilt || '2000',
          sold_price: homeFacts.sold_price || estimates.melissa?.Records?.[0]?.CurrentDeed?.SalePrice || '',
          sold_date: homeFacts.sold_date || estimates.melissa?.Records?.[0]?.CurrentDeed?.SaleDate || '',
          lat: homeFacts.lat || searchData.lat,
          long: homeFacts.long || searchData.long
        },
        loading: false,
        searchPerformed: true,
        sourceStatuses: buildSourceStatuses(estimates),
        error: null
      }));
    } catch (error) {
      console.error('Error fetching estimates:', error);
      this.setState({ 
        loading: false,
        error: 'Failed to fetch property estimates. Please try again.'
      });
    }
  }

  parseAddress = (address) => {
    // Simple address parser - you might want to use a more robust solution
    const parts = address.split(',').map(part => part.trim());
    const street = parts[0];
    const city = parts[1];
    const stateZip = parts[2].split(' ');
    const state = stateZip[0];
    const zip = stateZip[1];
    return [street, city, state, zip];
  }

  nodeFinder = (data) => {
    if (data !== null || data !== undefined) {
      return data;
    } else {
      return 'N/A';
    }
  };

  parseHome = (homeData) => {
    const homeObj ={
      home_type: this.nodeFinder(homeData.useCode),
      year_built: this.nodeFinder(homeData.yearBuilt),
      sqft: this.nodeFinder(homeData.finishedSqFt),
      lot_size: this.nodeFinder(homeData.lotSizeSqFt),
      bedrooms: this.nodeFinder(homeData.bedrooms),
      bathrooms: this.nodeFinder(homeData.bathrooms),
      total_rooms: this.nodeFinder(homeData.totalRooms),
      sold_date: this.nodeFinder(homeData.lastSoldDate),
      street_address: this.nodeFinder(homeData.address[0].street[0]),
      city: this.nodeFinder(homeData.address[0].city[0]),
      state: this.nodeFinder(homeData.address[0].state[0]),
      zip_code: this.nodeFinder(homeData.address[0].zipcode[0]),
      lat: this.nodeFinder(homeData.address[0].latitude),
      long: this.nodeFinder(homeData.address[0].longitude),
      link_to: this.nodeFinder(homeData.links[0].homedetails[0]),
    }
    return homeObj;
  }
  
  parseZillowEstimate = homeData => {
    const zData = {
      value: Number(homeData.zestimate[0].amount[0]._),
      link: homeData.links[0].homedetails[0]
    }
    return zData
  }

  errorCatch = (data) => {
    if(data.querySelector('code').innerHTML !== '0') {
      return true
    } else {
      return false
    }
  }

  toggleEstimate = (e, id, props) => {
    if(e.target.innerText === 'REMOVE SOURCE') {
      e.target.innerText = "Add Source";
      e.target.style.pointerEvents = 'all';
      e.target.style.cursor = 'pointer';
      e.target.style.color = 'red';
      e.target.parentElement.parentElement.parentElement.parentElement.classList.add("disabled");
      if(id === 1) {
        this.setState({
          estimates: {
            ...this.state.estimates,
            zillowEstimate: {
              ...this.state.estimates.zillowEstimate,
              active: false
            }
          }
        })
      } else if (id === 2) {
        this.setState({
          estimates: {
            ...this.state.estimates,
            realtorEstimate: {
              ...this.state.estimates.realtorEstimate,
              active: false
            }
          }
        })
      } else if (id === 3) {
        this.setState({
          estimates: {
            ...this.state.estimates,
            redfinEstimate: {
              ...this.state.estimates.redfinEstimate,
              active: false
            }
          }
        })
      } else if (id === 4) {
        this.setState({
          estimates: {
            ...this.state.estimates,
            melissaEstimate: {
              ...this.state.estimates.melissaEstimate,
              active: false
            }
          }
        })
      } else if (id === 5) {
        this.setState({
          estimates: {
            ...this.state.estimates,
            mashvisorEstimate: {
              ...this.state.estimates.mashvisorEstimate,
              active: false
            }
          }
        })
      } else if (id === 6) {
        this.setState({
          estimates: {
            ...this.state.estimates,
            homesEstimate: {
              ...this.state.estimates.homesEstimate,
              active: false
            }
          }
        })
      } else if (id === 7) {
        this.setState({
          estimates: {
            ...this.state.estimates,
            dataTreeEstimate: {
              ...this.state.estimates.dataTreeEstimate,
              active: false
            }
          }
        })
      } else if (id === 8) {
        this.setState({
          estimates: {
            ...this.state.estimates,
            estatedEstimate: {
              ...this.state.estimates.estatedEstimate,
              active: false
            }
          }
        })
      } else if (id === 9) {
        this.setState({
          estimates: {
            ...this.state.estimates,
            attomEstimate: {
              ...this.state.estimates.attomEstimate,
              active: false
            }
          }
        })
      } else if (id === 10) {
        this.setState({
          estimates: {
            ...this.state.estimates,
            rentcastEstimate: {
              ...this.state.estimates.rentcastEstimate,
              active: false
            }
          }
        })
      }

      // const id = e.target.parentElement.parentElement.parentElement.parentElement.dataset.id;
      // console.log(id)
      // this.deleteEstimate(id)
    } else if(e.target.innerText === 'ADD SOURCE') {
      e.target.innerText = "Remove Source";
      e.target.style.pointerEvents = '';
      e.target.style.cursor = '';
      e.target.style.color = '';
      e.target.parentElement.parentElement.parentElement.parentElement.classList.remove("disabled");
      if (id === 1) {
        this.setState({
          estimates: {
            ...this.state.estimates,
            zillowEstimate: {
              ...this.state.estimates.zillowEstimate,
              active: true
            }
          }
        })
      } else if (id === 2) {
        this.setState({
          estimates: {
            ...this.state.estimates,
            realtorEstimate: {
              ...this.state.estimates.realtorEstimate,
              active: true
            }
          }
        })
      } else if (id === 3) {
        this.setState({
          estimates: {
            ...this.state.estimates,
            redfinEstimate: {
              ...this.state.estimates.redfinEstimate,
              active: true
            }
          }
        })
      } else if (id === 4) {
        this.setState({
          estimates: {
            ...this.state.estimates,
            melissaEstimate: {
              ...this.state.estimates.melissaEstimate,
              active: true
            }
          }
        })
      } else if (id === 5) {
        this.setState({
          estimates: {
            ...this.state.estimates,
            mashvisorEstimate: {
              ...this.state.estimates.mashvisorEstimate,
              active: true
            }
          }
        })
      } else if (id === 6) {
        this.setState({
          estimates: {
            ...this.state.estimates,
            homesEstimate: {
              ...this.state.estimates.homesEstimate,
              active: true
            }
          }
        })
      } else if (id === 7) {
        this.setState({
          estimates: {
            ...this.state.estimates,
            dataTreeEstimate: {
              ...this.state.estimates.dataTreeEstimate,
              active: true
            }
          }
        })
      } else if (id === 8) {
        this.setState({
          estimates: {
            ...this.state.estimates,
            estatedEstimate: {
              ...this.state.estimates.estatedEstimate,
              active: true
            }
          }
        })
      } else if (id === 9) {
        this.setState({
          estimates: {
            ...this.state.estimates,
            attomEstimate: {
              ...this.state.estimates.attomEstimate,
              active: true
            }
          }
        })
      } else if (id === 10) {
        this.setState({
          estimates: {
            ...this.state.estimates,
            rentcastEstimate: {
              ...this.state.estimates.rentcastEstimate,
              active: true
            }
          }
        })
      }
    } 
  }

  deleteEstimate = (id) => {
    for(let i = 0; i < this.state.estimates; i++) {
      console.log(this.state.estimates[i])
    }
  }
    

  savePage = () => {
    const address = this.state.foundHome.street_address
    const divToDisplay = document.querySelector('#print-area')
    html2canvas(divToDisplay, {
      allowTaint: false,
      useCORS: true,
    })
    .then(function(canvas) {
      const divImage = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "pt", "legal");
      // const imgProps = pdf.getImageProperties(divImage);
      // const pdfWidth = pdf.internal.pageSize.getWidth();
      // const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(divImage, 'PNG', 0, 0, 600, 1080);
      pdf.save(`${address}.pdf`);
    })
  }

  getSearchResults = queryObj => {
    this.handleSearch(queryObj);
  };

  handleChange = e => {
    console.log(e.target.value);
  };

  isEmpty = obj => {
    return !obj || Object.keys(obj).length === 0;
  };

  render() {
    return (
      <div className="App">
        {this.state.isLoading || this.state.loading ?
          <EstimateLoading /> : null}
        <CssBaseline />
        <Routes>
          <Route exact path="/admin" element={<AdminUsageDashboard />} />
          <Route exact path="/profile" element={<ProfilePage />} />
          <Route exact path="/signup" element={<SignUp />} />
          <Route exact path="/about" element={
            <>
              <div className="header">
                <NavMenu />
              </div>
              <div className="flex-wrapper">
                <AboutContent />
                <Footer />
              </div>
            </>
          } />
          <Route exact path="/contact" element={
            <>
              <NavMenu />
              <div className="flex-wrapper">
                <ContactContent />
                <Footer />
              </div>
            </>
          } />
          <Route exact path="/sell-my-home" element={
            <>
              <div className="header">
                <NavMenu />
              </div>
              <div className="flex-wrapper">
                <SellMyHomeContent />
                <Footer />
              </div>
            </>
          } />
          <Route exact path="/estimates" element={
            <>
              <NavContainer
                loggedin={this.state.isLoggedIn}
                search={this.getSearchResults}
              />
              <div className="flex-wrapper">
                <Element name="search-results">
                  {this.isEmpty(this.state.foundHome) ? (
                    <EmptySearchContainer isLoading={this.state.isLoading}/>
                  ) : (
                    <APIContainer
                      home={this.state.foundHome}
                      extraHomeData={this.state.extraHomeData}
                      estimates={this.state.estimates}
                      sourceStatuses={this.state.sourceStatuses}
                      toggleEstimate={this.toggleEstimate}
                      savePage={this.savePage}
                    />
                  )}
                </Element>
                <Footer />
              </div>
            </>
          } />
          <Route path="/" element={
            <>
              <LandingPageContainer
                search={this.getSearchResults}
              />
              <LandingPageContent />
              <Footer />
            </>
          } />
        </Routes>
      </div>
    );
  }
};
