declare module '@react-native-masked-view/masked-view' {
  import type { ComponentType } from 'react';
  import type { ViewProps } from 'react-native';

  interface MaskedViewProps extends ViewProps {
    maskElement: React.ReactElement;
    androidRenderingMode?: 'software' | 'hardware';
  }

  const MaskedView: ComponentType<MaskedViewProps>;
  export default MaskedView;
}
