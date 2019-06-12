import { createSwitchNavigator } from '@react-navigation/core'
import { createBrowserApp } from '@react-navigation/web'
import React from 'react'
import GDStore from '../../../../lib/undux/GDStore'
const { Container } = GDStore

const withContainer = Component => props => (
  <Container>
    <Component {...props} />
  </Container>
)

export const getWebRouterComponentWithRoutes = (routes = {}, data) => {
  const AppNavigator = createSwitchNavigator(routes)
  class AppNavigation extends React.Component<AppNavigationProps, AppNavigationState> {
    static router = AppNavigator.router

    static navigationOptions = AppNavigator.navigationOptions

    render() {
      return <AppNavigator navigation={this.props.navigation} screenProps={{ routes, data }} />
    }
  }
  return withContainer(createBrowserApp(createSwitchNavigator({ AppNavigation })))
}

export const getWebRouterComponentWithMocks = (componentPath, data) => {
  const Component = require(`../${componentPath}`).default

  const routes = {
    Component
  }

  return getWebRouterComponentWithRoutes(routes, data)
}
