// @flow
import React from 'react'
import { Platform, ScrollView, TouchableOpacity, View } from 'react-native'

import useSideMenu from '../../lib/hooks/useSideMenu'
import { withStyles } from '../../lib/styles'

import { Icon } from '../common'
import useOnPress from '../../lib/hooks/useOnPress'
import SideMenuItem from './SideMenuItem'

type SideMenuPanelProps = {
  navigation: any,
}

const SideMenuPanel = ({ navigation, styles, theme }: SideMenuPanelProps) => {
  const { slideToggle, topItems, bottomItems } = useSideMenu({
    navigation,
    theme,
  })

  const onPressClose = useOnPress(slideToggle)

  return (
    <ScrollView contentContainerStyle={styles.scrollableContainer}>
      <TouchableOpacity style={styles.closeIconRow} onPress={onPressClose} testID="close_burger_button">
        <Icon name="close" size={20} color={theme.colors.lighterGray} />
      </TouchableOpacity>
      <View style={styles.listContainer}>
        {topItems.map(item => !item.hidden && <SideMenuItem key={item.name} {...item} />)}
        <View style={styles.alignBottom}>
          {bottomItems.map(item => (
            <SideMenuItem key={item.name} {...item} />
          ))}
        </View>
      </View>
    </ScrollView>
  )
}

const sideMenuPanelStyles = ({ theme }) => ({
  scrollableContainer: {
    flexGrow: 1,
  },
  closeIconRow: {
    flex: -1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingTop: theme.sizes.defaultDouble,
    paddingBottom: theme.sizes.defaultQuadruple,
    marginHorizontal: theme.sizes.defaultDouble,
    minHeight: 20,
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  listContainer: {
    flexGrow: 1,
    borderTopWidth: 1,
    borderTopColor: theme.colors.lightGray,
    ...Platform.select({
      web: {
        borderTopStyle: 'solid',
      },
    }),
    marginHorizontal: theme.sizes.defaultDouble,
  },
  alignBottom: {
    marginTop: 'auto',
  },
})

export default withStyles(sideMenuPanelStyles)(SideMenuPanel)
