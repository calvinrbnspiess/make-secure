export const checkConnection = async (
  publicAddress: string,
  httpPort = 80,
  httpsPort = 443
) => {
  let httpAvailable = false;
  let httpsAvailable = false;

  try {
    const httpResponse = await fetch(`http://${publicAddress}:${httpPort}`);
    httpAvailable = httpResponse.status === 200;
  } catch (error) {
    httpAvailable = false;
  }

  try {
    const httpsResponse = await fetch(`https://${publicAddress}:${httpsPort}`);
    httpsAvailable = httpsResponse.status === 200;
  } catch (error) {
    httpsAvailable = false;
  }

  return {
    httpAvailable,
    httpsAvailable,
  };
};
