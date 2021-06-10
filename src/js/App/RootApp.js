import React, { memo, useEffect, useRef } from 'react';
import classnames from 'classnames';
import PropTypes from 'prop-types';
import { connect, shallowEqual, useDispatch, useSelector } from 'react-redux';
import GlobalFilter from './GlobalFilter/GlobalFilter';
import { useScalprum, ScalprumComponent } from '@scalprum/react-core';
import { Page, PageHeader, PageSidebar } from '@patternfly/react-core';
import { BrowserRouter, useLocation } from 'react-router-dom';
import SideNav from './Sidenav/SideNav';
import { Header, HeaderTools } from './Header/Header';
import ErrorBoundary from './ErrorBoundary';
import { isBeta } from '../utils';
import LandingNav from './Sidenav/LandingNav';
import isEqual from 'lodash/isEqual';
import { onToggle } from '../redux/actions';
import LoadingFallback from '../utils/loading-fallback';
import checkSubAppExceptionModule from '../utils/modulesExceptions';
import Routes from './Routes';

const isModule = (key, chrome) =>
  key === (chrome?.activeSection?.id || chrome?.activeLocation) ||
  (key !== undefined && chrome?.activeSection?.group !== undefined && key === chrome?.activeSection?.group);

const ShieldedRoot = memo(
  ({ useLandingNav, hideNav, insightsContentRef, isGlobalFilterEnabled, initialized, remoteModule, appId }) => {
    const dispatch = useDispatch();
    const isOpen = useSelector(({ chrome }) => chrome?.contextSwitcherOpen);
    useEffect(() => {
      const navToggleElement = document.querySelector('button#nav-toggle');
      if (navToggleElement) {
        navToggleElement.onclick = () => dispatch(onToggle());
      }
    }, []);

    if (!initialized) {
      return null;
    }
    return (
      <Page
        isManagedSidebar={!hideNav}
        header={
          <PageHeader
            className={classnames({ 'context-switcher-banner': isOpen })}
            logoComponent="div"
            logo={<Header />}
            showNavToggle={!hideNav}
            headerTools={<HeaderTools />}
          />
        }
        sidebar={hideNav ? undefined : <PageSidebar id="ins-c-sidebar" nav={useLandingNav ? <LandingNav /> : <SideNav key="side-nav" />} />}
      >
        <div ref={insightsContentRef} className={classnames('ins-c-render', { 'ins-m-full--height': !isGlobalFilterEnabled })}>
          {isGlobalFilterEnabled && <GlobalFilter />}
          <Routes insightsContentRef={insightsContentRef} />
          <main className="pf-c-page__main" id="no-access"></main>
        </div>
      </Page>
    );
  },
  (prevProps, nextProps) => isEqual(prevProps, nextProps)
);

ShieldedRoot.propTypes = {
  useLandingNav: PropTypes.bool,
  hideNav: PropTypes.bool,
  insightsContentRef: PropTypes.object.isRequired,
  isGlobalFilterEnabled: PropTypes.bool.isRequired,
  initialized: PropTypes.bool,
  remoteModule: PropTypes.shape({
    appName: PropTypes.string.isRequired,
  }),
  appId: PropTypes.string,
};
ShieldedRoot.defaultProps = {
  useLandingNav: false,
  hideNav: false,
  isGlobalFilterEnabled: false,
  initialized: false,
};
ShieldedRoot.displayName = 'ShieldedRoot';

const RootApp = ({ activeApp, activeLocation, appId, config, pageAction, pageObjectId, globalFilterHidden }) => {
  const scalprum = useScalprum(config);
  const hideNav = useSelector(({ chrome: { user } }) => !user);
  const { pathname } = useLocation();
  /**
   * Using the chrome landing flag is not going to work because the appId is initialized inside the app.
   * We need the information before anything is rendered to determine if we use root module or render landing page.
   * This will be replaced once we can use react router for all pages. Landing page will have its own route.
   */
  const isLanding = pathname === '/';

  const isGlobalFilterEnabled =
    !isLanding && ((!globalFilterHidden && activeLocation === 'insights') || Boolean(localStorage.getItem('chrome:experimental:global-filter')));
  const insightsContentRef = useRef(null);

  return (
    <div
      id="chrome-app-render-root"
      className="pf-c-drawer__content"
      data-ouia-subnav={activeApp}
      data-ouia-bundle={activeLocation}
      data-ouia-app-id={appId}
      data-ouia-safe="true"
      {...(pageAction && { 'data-ouia-page-type': pageAction })}
      {...(pageObjectId && { 'data-ouia-page-object-id': pageObjectId })}
    >
      <ShieldedRoot
        isGlobalFilterEnabled={isGlobalFilterEnabled}
        hideNav={hideNav}
        insightsContentRef={insightsContentRef}
        useLandingNav={isLanding}
        initialized={scalprum.initialized}
      />
    </div>
  );
};

RootApp.propTypes = {
  appId: PropTypes.string,
  activeApp: PropTypes.string,
  activeLocation: PropTypes.string,
  pageAction: PropTypes.string,
  pageObjectId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  globalFilterHidden: PropTypes.bool,
  config: PropTypes.any,
};

function stateToProps({ chrome: { activeApp, activeLocation, appId, pageAction, pageObjectId }, globalFilter: { globalFilterRemoved } = {} }) {
  return { activeApp, activeLocation, appId, pageAction, pageObjectId, globalFilterRemoved };
}
const ConnectedRootApp = connect(stateToProps, null)(RootApp);

const Chrome = (props) => (
  <BrowserRouter basename={isBeta() ? '/beta' : '/'}>
    <ConnectedRootApp {...props} />
  </BrowserRouter>
);

export default Chrome;
