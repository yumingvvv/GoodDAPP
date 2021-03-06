/* eslint-disable no-undef */
class SocialLoginPage {
  get googleLink() {
    return this._socialLink('google')
  }

  get facebookLink() {
    return this._socialLink('facebook')
  }

  _socialLink(network) {
    return cy.get(`[data-testid="login_with_${network}"]`)
  }
}

export default new SocialLoginPage()
