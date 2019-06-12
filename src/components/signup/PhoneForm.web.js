// @flow
import React from 'react'
import PhoneInput from 'react-phone-number-input'
import './PhoneForm.css'
import GDStore from '../../lib/undux/GDStore'
import { Description, Title, Wrapper } from './components'
import { userModelValidations } from '../../lib/gundb/UserModel'
import api from '../../lib/API/api'

type Props = {
  // callback to report to parent component
  doneCallback: ({ phone: string }) => null,
  screenProps: any,
  navigation: any
}

export type MobileRecord = {
  mobile: string,
  errorMessage?: string,
  countryCode?: string
}

type State = MobileRecord

class PhoneForm extends React.Component<Props, State> {
  state = {
    mobile: this.props.screenProps.data.mobile || '',
    errorMessage: '',
    countryCode: null
  }
  isValid = false

  setCountryCode = async () => {
    const countryCode = await api.getLocation()
    console.log(countryCode)
    this.setState({ countryCode })
  }

  componentDidMount() {
    this.setCountryCode()
  }

  handleChange = (mobile: string) => {
    if (this.state.errorMessage !== '') {
      this.setState({ errorMessage: '' })
    }

    this.setState({ mobile })
  }

  handleSubmit = () => {
    if (this.isValid) {
      this.props.screenProps.doneCallback({ mobile: this.state.mobile })
    }
  }

  handleEnter = (event: { nativeEvent: { key: string } }) => {
    if (event.keyCode === 13 && this.isValid) {
      this.handleSubmit()
    }
  }

  checkErrors = () => {
    const errorMessage = userModelValidations.mobile(this.state.mobile)
    this.setState({ errorMessage })
  }

  render() {
    const errorMessage = this.state.errorMessage || this.props.screenProps.error
    this.props.screenProps.error = undefined

    this.isValid = userModelValidations.mobile(this.state.mobile) === ''
    const { key } = this.props.navigation.state
    const { loading } = this.props.screenProps.data
    return (
      <Wrapper valid={this.isValid} handleSubmit={this.handleSubmit} loading={loading}>
        <Title>{`${this.props.screenProps.data.fullName.split(' ')[0]}, \n May we have your number please?`}</Title>
        <PhoneInput
          id={key + '_input'}
          value={this.state.mobile}
          onChange={this.handleChange}
          onBlur={this.checkErrors}
          error={errorMessage}
          onKeyDown={this.handleEnter}
          country={this.state.countryCode}
        />
        <Description>A verification code will be sent to this number</Description>
      </Wrapper>
    )
  }
}

export default GDStore.withStore(PhoneForm)
