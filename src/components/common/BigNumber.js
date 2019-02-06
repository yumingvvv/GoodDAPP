// @flow
import React from 'react'
import { View, StyleSheet } from 'react-native'
import { Text } from 'react-native-paper'
import { normalize } from 'react-native-elements'
import { fontStyle } from './styles'

export default (props: any) => (
  <View style={[styles.bigNumberWrapper, props.style]}>
    <Text style={styles.bigNumber}>{props.number}</Text>
    <Text style={styles.bigNumberUnit}>{props.unit}</Text>
  </View>
)

const styles = StyleSheet.create({
  bigNumberWrapper: {
    display: 'inline-block'
  },
  bigNumber: {
    ...fontStyle,
    fontSize: normalize(32),
    textAlign: 'right'
  },
  bigNumberUnit: {
    ...fontStyle,
    textAlign: 'right'
  }
})
