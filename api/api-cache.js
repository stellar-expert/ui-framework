import {InMemoryClientCache} from '@stellar-expert/client-cache'

const apiCache = new InMemoryClientCache({prefix: 'ac:'})

export default apiCache