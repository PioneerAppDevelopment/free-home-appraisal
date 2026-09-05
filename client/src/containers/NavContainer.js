import React from 'react';
import Title from '../components/Title';
// import SearchBar from '../components/SearchBar';
import { Grid } from '@mui/material';
import Logo from '../components/Logo';
import NavMenu from '../components/NavMenu';
import NewSearch from '../components/NewSearch';


export default function NavContainer(props) {
    
    return (
        <div className="nav">
            <div className="fade">
                <div className="logo-container">
                    <Logo />
                </div>
                <NavMenu />
                <Title />
                <Grid container direction="row" justifyContent="center" alignItems="center">
                    <Grid item>
                        <div className="search-bar-container">
                            <h1 style={{paddingBottom: 0}}>Get a free home value estimate</h1>
                            <h3 style={{paddingBottom: 0}}>Enter an address below to see estimated values from dozens of real estate websites, in one place.</h3>
                            {/* <SearchBar search={props.search} /> */}
                            <NewSearch search={props.search}/>
                            <p className="home-intro-copy">
                                FreeHomeAppraisal.com pulls home estimates from dozens of real estate websites and combines them into one home value. That saves you from opening site after site. More sources will be added over time.
                            </p>
                        </div>
                    </Grid>
                </Grid>
            </div>
        </div>
    )
}
