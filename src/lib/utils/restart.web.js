export default (redirectUrl = null) => {
  const { location } = window
  
  if (!redirectUrl) {
    location.reload(true)
    return
  }
  
  location.replace(redirectUrl)
}
