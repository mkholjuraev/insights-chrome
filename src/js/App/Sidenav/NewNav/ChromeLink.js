import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { NavLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import { appNavClick } from '../../../redux/actions';

const useDynamicModule = () => {
  const [isDynamic, setIsDynamic] = useState(undefined);
  const { modules, activeModule } = useSelector(({ chrome: { modules, activeModule } }) => ({
    modules,
    activeModule,
  }));
  useEffect(() => {
    const currentModule = modules[activeModule];
    if (currentModule) {
      setIsDynamic(currentModule.dynamic !== false);
    }
  }, [activeModule]);

  return { isDynamic, activeModule };
};

const LinkWrapper = ({ href, className, children }) => {
  let actionId = href.split('/').slice(2).join('/');
  if (actionId.includes('/')) {
    actionId = actionId.split('/').pop();
  }
  const domEvent = {
    href,
    id: actionId,
    navId: actionId,
  };
  const dispatch = useDispatch();
  const onClick = () => {
    dispatch(appNavClick({ id: actionId }, domEvent));
  };
  return (
    <NavLink onClick={onClick} to={href} className={className}>
      {children}
    </NavLink>
  );
};

LinkWrapper.propTypes = {
  href: PropTypes.string.isRequired,
  className: PropTypes.string,
  children: PropTypes.node.isRequired,
};

const basepath = document.baseURI;

const RefreshLink = ({
  href,
  isExternal,
  onClick /** on click must be separated because PF adds prevent default. We want that only for SPA links */,
  ...props
}) => <a href={isExternal ? href : `${basepath}${href.replace(/^\//, '')}`} {...props} />;

RefreshLink.propTypes = {
  href: PropTypes.string.isRequired,
  isExternal: PropTypes.bool,
  appId: PropTypes.string,
  onClick: PropTypes.any,
};

const ChromeLink = ({ appId, children, ...rest }) => {
  const { isDynamic, activeModule } = useDynamicModule();
  if (typeof isDynamic === 'undefined') {
    return null;
  }
  const LinkComponent = isDynamic || appId === activeModule ? LinkWrapper : RefreshLink;
  return (
    <LinkComponent appId={appId} {...rest}>
      {children}
    </LinkComponent>
  );
};

ChromeLink.propTypes = {
  appId: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

export default ChromeLink;
