import useInterval from '@use-it/interval'
import { useEffect, useRef, useState } from 'react'
import { Animated } from 'react-native'

export const animationConfig = {
  duration: 150,
}

export function useAnimation<T extends Props>(
  enabled: boolean,
  props: T,
  config?: Partial<Animated.TimingAnimationConfig>,
): Interpolate<T> {
  const r = useRef<Animated.Value>()
  if (!r.current) {
    r.current = new Animated.Value(0)
  }

  const v = r.current
  useEffect(() => {
    const t = Animated.timing(v, {
      useNativeDriver: false,
      ...animationConfig,
      ...config,
      toValue: enabled ? 1 : 0,
    })
    t.start()
    return () => t.stop()
  }, [enabled, config, v])

  const m = {} as Interpolate<T>
  Object.keys(props).forEach((k: keyof T) => {
    m[k] = v.interpolate({
      inputRange: [0, 1],
      outputRange: props[k],
    })
  })
  return m
}

export const useAnimationOnDidMount = (props: Props) => {
  const [didMount, setDidMount] = useState(false)
  useEffect(() => setDidMount(true), [])
  return useAnimation(didMount, props)
}

export const useAnimationInterval = (props: Props, duration = 300) => {
  const [isStart, setIsStart] = useState(true)
  useInterval(() => setIsStart(i => !i), duration)
  return useAnimation(isStart, props, { duration })
}

type Props = {
  [k: string]: string[] | number[]
}
type Interpolate<T extends Props> = {
  [K in keyof T]: Animated.AnimatedInterpolation
}
