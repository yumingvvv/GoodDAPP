// @flow
import React, { useEffect, useState } from 'react'
import { Image, View } from 'react-native'
import userStorage, { type TransactionEvent } from '../../lib/gundb/UserStorage'
import goodWallet from '../../lib/wallet/GoodWallet'
import logger from '../../lib/logger/pino-logger'
import GDStore from '../../lib/undux/GDStore'
import SimpleStore from '../../lib/undux/SimpleStore'
import { useDialog } from '../../lib/undux/utils/dialog'
import wrapper from '../../lib/undux/utils/wrapper'
import { weiToMask } from '../../lib/wallet/utils'
import { CustomButton, Text, Wrapper } from '../common'
import TopBar from '../common/view/TopBar'
import ErrorIcon from '../common/modal/ErrorIcon'
import LoadingIcon from '../common/modal/LoadingIcon'
import SuccessIcon from '../common/modal/SuccessIcon'
import { withStyles } from '../../lib/styles'
import normalize from '../../lib/utils/normalizeText'
import type { DashboardProps } from './Dashboard'

type ClaimProps = DashboardProps
type ClaimState = {
  nextClaim: string,
  entitlement: number,
  claimedToday: {
    people: string,
    amount: string,
  },
}

const log = logger.child({ from: 'Claim' })
const illustration = require('../../assets/Claim/illustration.png')

Image.prefetch(illustration)

const Claim = props => {
  const { screenProps, styles }: ClaimProps = props
  const store = SimpleStore.useStore()
  const gdstore = GDStore.useStore()

  const [showDialog] = useDialog()
  const [loading, setLoading] = useState(false)
  const [claimInterval, setClaimInterval] = useState(null)
  const [state, setState]: [ClaimState, Function] = useState({
    nextClaim: '--:--:--',
    entitlement: 0,
    claimedToday: {
      people: '--',
      amount: '--',
    },
  })
  const wrappedGoodWallet = wrapper(goodWallet, store)

  // if we returned from facerecoginition then the isValid param would be set
  // this happens only on first claim
  const evaluateFRValidity = async () => {
    const isValid = screenProps.screenState && screenProps.screenState.isValid

    log.debug('from FR:', { isValid })

    if (isValid && (await goodWallet.isCitizen())) {
      handleClaim()
    } else if (isValid === false) {
      screenProps.goToRoot()
    }
  }

  // FR Evaluation
  useEffect(() => {
    evaluateFRValidity()
  }, [])

  const getNextClaim = nextClaimDate => new Date(nextClaimDate - new Date().getTime()).toISOString().substr(11, 8)

  const gatherStats = async () => {
    store.set('loadingIndicator')({ loading: true })

    const entitlement = await wrappedGoodWallet.checkEntitlement()

    const [claimedToday, nextClaimDate] = await Promise.all([
      wrappedGoodWallet.getAmountAndQuantityClaimedToday(entitlement),
      wrappedGoodWallet.getNextClaimTime(),
    ])

    setState(prevState => ({ ...prevState, claimedToday, entitlement, nextClaim: getNextClaim(nextClaimDate) }))

    store.set('loadingIndicator')({ loading: false })

    setClaimInterval(
      setInterval(() => {
        const nextClaim = getNextClaim(nextClaimDate)
        setState(prevState => ({ ...prevState, nextClaim }))
      }, 1000)
    )
  }

  // Claim STATS
  useEffect(() => {
    gatherStats()
    return () => clearInterval(claimInterval)
  }, [])

  const handleClaim = async () => {
    setLoading(true)

    showDialog({
      dismissText: 'OK',
      loading,
      message: 'please wait while processing...',
      image: <LoadingIcon />,
      title: `YOUR G$\nIS ON IT'S WAY...`,
    })

    try {
      const receipt = await goodWallet.claim({
        onTransactionHash: async hash => {
          const entitlement = await wrappedGoodWallet.checkEntitlement()
          const transactionEvent: TransactionEvent = {
            id: hash,
            date: new Date().toString(),
            type: 'claim',
            data: {
              from: 'GoodDollar',
              amount: entitlement,
            },
          }
          userStorage.enqueueTX(transactionEvent)
        },
      })

      if (receipt.status) {
        showDialog({
          dismissText: 'Yay!',
          image: <SuccessIcon />,
          message: `You've claimed your G$`,
          title: 'SUCCESS!',
          type: 'success',
        })
      } else {
        showDialog({
          dismissText: 'OK',
          image: <ErrorIcon />,
          message: 'Something went wrong with the transaction.\nSee feed details for further information.',
          title: 'Claiming Failed',
          type: 'error',
        })
      }
    } catch (e) {
      log.error('claiming failed', e)

      showDialog({
        dismissText: 'OK',
        image: <ErrorIcon />,
        message: `${e.message}.\nTry again later.`,
        title: 'Claiming Failed',
        type: 'error',
      })
    } finally {
      setLoading(false)
    }
  }

  const faceRecognition = () => {
    screenProps.push('FRIntro', { from: 'Claim' })
  }

  const { entitlement } = gdstore.get('account')
  const isCitizen = gdstore.get('isLoggedInCitizen')
  const { nextClaim, claimedToday } = state

  const ClaimButton = (
    <CustomButton
      compact={true}
      disabled={entitlement <= 0}
      loading={loading}
      mode="contained"
      onPress={() => {
        isCitizen ? handleClaim() : faceRecognition()
      }}
    >
      {`CLAIM YOUR SHARE - ${weiToMask(entitlement, { showUnits: true })}`}
    </CustomButton>
  )

  return (
    <Wrapper>
      <TopBar push={screenProps.push} />
      <View style={[styles.mainContainer]}>
        <View style={[styles.mainText]}>
          <Text style={[styles.mainTextTitle]}>GoodDollar allows you to collect</Text>
          <Text style={[styles.mainTextBigMarginBottom]}>
            <Text style={[styles.mainTextBig]}>1</Text>
            <Text style={[styles.mainTextSmall]}> G$</Text>
            <Text style={[styles.mainTextBig]}> Free</Text>
          </Text>
          <Text style={[styles.mainTextBig]}>Every Day</Text>
        </View>

        <View style={[styles.extraInfo]}>
          <Image source={illustration} style={styles.illustration} resizeMode="contain" />
          <View style={styles.extraInfoStats}>
            <Text>
              <Text style={[styles.extraInfoStatsText, styles.textBold, styles.textPrimary]}>
                {claimedToday.people}{' '}
              </Text>
              <Text style={[styles.extraInfoStatsText]}>People Claimed </Text>
              <Text style={[styles.extraInfoStatsText, styles.textBold, styles.textPrimary]}>
                {claimedToday.amount}
              </Text>
              <Text
                style={[styles.extraInfoStatsText, styles.textBold, styles.textPrimary, styles.extraInfoStatsSmallText]}
              >
                G${' '}
              </Text>
              <Text style={[styles.extraInfoStatsText]}>Today!</Text>
            </Text>
          </View>
          <View style={[styles.extraInfoCountdown]}>
            <Text style={[styles.extraInfoCountdownTitle]}>Next Daily Income:</Text>
            <Text style={[styles.extraInfoCountdownNumber]}>{nextClaim}</Text>
          </View>
          {ClaimButton}
        </View>
      </View>
    </Wrapper>
  )
}

const getStylesFromProps = ({ theme }) => ({
  mainContainer: {
    flexGrow: 1,
  },
  mainText: {
    alignItems: 'center',
    flexDirection: 'column',
    marginBottom: 65,
    paddingTop: 16,
  },
  mainTextTitle: {
    color: '#fff',
    fontFamily: 'Roboto',
    fontSize: normalize(15.5),
    marginBottom: 12,
  },
  mainTextBig: {
    color: '#fff',
    fontFamily: 'RobotoSlab-Bold',
    fontSize: normalize(36),
  },
  mainTextBigMarginBottom: {
    marginBottom: 4,
  },
  mainTextSmall: {
    color: '#fff',
    fontFamily: 'RobotoSlab-Bold',
    fontSize: normalize(20),
  },
  illustration: {
    marginBottom: 8,
    marginTop: -80,
    maxWidth: '100%',
    minHeight: 159,
    minWidth: 229,
  },
  extraInfo: {
    backgroundColor: '#fff',
    borderRadius: theme.sizes.borderRadius,
    flexGrow: 1,
    flexShrink: 1,
    minHeight: 0,
    paddingBottom: 16,
    paddingLeft: 8,
    paddingRight: 8,
    paddingTop: 16,
  },
  extraInfoStats: {
    alignItems: 'center',
    backgroundColor: theme.colors.lightGray,
    borderRadius: theme.sizes.borderRadius,
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: 8,
    paddingLeft: 4,
    paddingRight: 4,
    paddingTop: 8,
    marginLeft: 0,
    marginRight: 0,
    marginBottom: 8,
    marginTop: 0,
  },
  extraInfoStatsText: {
    fontFamily: 'Roboto',
    fontSize: normalize(15.5),
  },
  extraInfoStatsSmallText: {
    fontSize: normalize(10),
  },
  textBold: {
    fontFamily: 'Roboto-Bold',
  },
  textPrimary: {
    color: theme.colors.primary,
  },
  extraInfoCountdown: {
    alignItems: 'center',
    backgroundColor: theme.colors.lightGray,
    borderRadius: theme.sizes.borderRadius,
    flexDirection: 'column',
    flexGrow: 2,
    justifyContent: 'center',
    marginBottom: 16,
    marginLeft: 0,
    marginRight: 0,
    marginTop: 0,
    paddingBottom: 8,
    paddingLeft: 4,
    paddingRight: 4,
    paddingTop: 8,
  },
  extraInfoCountdownTitle: {
    fontFamily: 'Roboto',
    fontSize: normalize(15.5),
  },
  extraInfoCountdownNumber: {
    color: theme.colors.green,
    fontFamily: 'RobotoSlab-Bold',
    fontSize: normalize(36),
  },
})

Claim.navigationOptions = {
  title: 'Claim Daily G$',
}

export default withStyles(getStylesFromProps)(Claim)
