module.exports = ({ github, context, core, io }) => {
  return context.payload.client_payload.value
}