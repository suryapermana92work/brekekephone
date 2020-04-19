declare module 'brekekejs/lib/ucclient' {
  import { UcChatClient, UcLogger } from './api/Brekeke'

  export = {
    ChatClient: UcChatClient,
    Logger: UcLogger,
  }
}

declare module 'react-native-uuid' {
  import uuid from 'uuid'

  export = uuid
}

declare module 'handlebars/dist/handlebars' {
  import Handlebars, { HelperDelegate } from 'handlebars'

  export = Handlebars
}

declare module 'helper-moment' {
  const h: HelperDelegate
  export = h
}
