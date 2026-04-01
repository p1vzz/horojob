import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, Text, View, FlatList, NativeScrollEvent, NativeSyntheticEvent, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ITEM_HEIGHT = 36;
const VISIBLE_ITEMS = 5;
const WHEEL_VIEWPORT_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;
const H_PADDING = 16;
const OVERLAY_Z_INDEX = 1200;

const pad = (n: number) => String(n).padStart(2, '0');

const daysInMonth = (year: number, month: number) => {
  return new Date(year, month, 0).getDate();
};

type WheelProps<T> = {
  data: T[];
  value: T;
  width: number;
  format: (v: T) => string;
  onChange: (v: T) => void;
};

const Wheel = <T,>({ data, value, width, format, onChange }: WheelProps<T>) => {
  const ref = useRef<FlatList<T>>(null);

  useEffect(() => {
    const index = Math.max(0, data.indexOf(value));
    ref.current?.scrollToOffset({ offset: index * ITEM_HEIGHT, animated: false });
  }, [data, value]);

  const onMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
    const clampedIndex = Math.min(Math.max(index, 0), data.length - 1);
    const next = data[clampedIndex];
    ref.current?.scrollToOffset({ offset: clampedIndex * ITEM_HEIGHT, animated: true });
    onChange(next);
  };

  return (
    <View style={{ width, height: WHEEL_VIEWPORT_HEIGHT, overflow: 'hidden' }}>
      <FlatList
        ref={ref}
        data={data}
        keyExtractor={(_, i) => `i-${i}`}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        onMomentumScrollEnd={onMomentumScrollEnd}
        onScrollEndDrag={onMomentumScrollEnd}
        getItemLayout={(_, index) => ({
          length: ITEM_HEIGHT,
          offset: ITEM_HEIGHT * index,
          index,
        })}
        contentContainerStyle={{
          paddingVertical: ITEM_HEIGHT * Math.floor(VISIBLE_ITEMS / 2),
        }}
        renderItem={({ item }) => (
          <View style={{ height: ITEM_HEIGHT, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: 'rgba(212,212,224,0.8)', fontSize: 15 }}>{format(item)}</Text>
          </View>
        )}
      />
    </View>
  );
};

type DatePickerProps = {
  visible: boolean;
  initialDate: Date;
  onCancel: () => void;
  onConfirm: (date: Date) => void;
};

export const GlassDatePicker = ({ visible, initialDate, onCancel, onConfirm }: DatePickerProps) => {
  const insets = useSafeAreaInsets();
  const today = new Date();
  const years = useMemo(() => {
    const arr: number[] = [];
    for (let y = today.getFullYear(); y >= 1930; y--) arr.push(y);
    return arr;
  }, [today]);

  const [year, setYear] = useState(initialDate.getFullYear());
  const [month, setMonth] = useState(initialDate.getMonth() + 1);
  const [day, setDay] = useState(initialDate.getDate());

  useEffect(() => {
    if (!visible) return;
    setYear(initialDate.getFullYear());
    setMonth(initialDate.getMonth() + 1);
    setDay(initialDate.getDate());
  }, [visible, initialDate]);

  const days = useMemo(() => {
    const max = daysInMonth(year, month);
    const arr = Array.from({ length: max }, (_, i) => i + 1);
    if (day > max) setDay(max);
    return arr;
  }, [year, month, day]);

  const months = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), []);

  const confirm = () => {
    const d = new Date(year, month - 1, day);
    onConfirm(d);
  };
  const selectionTop = (WHEEL_VIEWPORT_HEIGHT - ITEM_HEIGHT) / 2;
  if (!visible) return null;

  return (
    <View style={styles.overlayRoot} pointerEvents="box-none">
      <Pressable style={styles.overlayBackdrop} onPress={onCancel} />
      <View
        style={{
          paddingTop: 12,
          paddingHorizontal: 16,
          paddingBottom: Math.max(16, insets.bottom + 8),
        }}
      >
        <View
          style={{
            borderRadius: 20,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.08)',
            backgroundColor: 'rgba(10,10,18,0.9)',
          }}
        >
          <LinearGradient
            colors={['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.02)', 'rgba(0,0,0,0.4)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ paddingHorizontal: H_PADDING, paddingTop: H_PADDING, paddingBottom: 12 }}
          >
            <Text style={{ color: 'rgba(212,212,224,0.8)', fontSize: 14, textAlign: 'center', marginBottom: 12 }}>
              Select Date
            </Text>
            <View style={{ position: 'relative', height: WHEEL_VIEWPORT_HEIGHT }}>
              <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 16 }}>
                <Wheel data={days} value={day} width={80} format={(v) => pad(v)} onChange={setDay} />
                <Wheel data={months} value={month} width={80} format={(v) => pad(v)} onChange={setMonth} />
                <Wheel data={years} value={year} width={100} format={(v) => String(v)} onChange={setYear} />
              </View>
              <View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: selectionTop,
                  height: ITEM_HEIGHT,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: 'rgba(201,168,76,0.35)',
                  backgroundColor: 'rgba(201,168,76,0.05)',
                }}
              />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 }}>
              <Pressable onPress={onCancel} style={{ paddingVertical: 10, paddingHorizontal: 16 }}>
                <Text style={{ color: 'rgba(212,212,224,0.6)' }}>Cancel</Text>
              </Pressable>
              <Pressable onPress={confirm} style={{ paddingVertical: 10, paddingHorizontal: 16 }}>
                <Text style={{ color: 'rgba(201,168,76,0.9)' }}>Done</Text>
              </Pressable>
            </View>
          </LinearGradient>
        </View>
      </View>
    </View>
  );
};

type TimePickerProps = {
  visible: boolean;
  initialTime: Date;
  onCancel: () => void;
  onConfirm: (date: Date) => void;
};

export const GlassTimePicker = ({ visible, initialTime, onCancel, onConfirm }: TimePickerProps) => {
  const insets = useSafeAreaInsets();
  const [hour, setHour] = useState(initialTime.getHours());
  const [minute, setMinute] = useState(initialTime.getMinutes());

  useEffect(() => {
    if (!visible) return;
    setHour(initialTime.getHours());
    setMinute(initialTime.getMinutes());
  }, [visible, initialTime]);

  const hours = useMemo(() => Array.from({ length: 24 }, (_, i) => i), []);
  const minutes = useMemo(() => Array.from({ length: 60 }, (_, i) => i), []);

  const confirm = () => {
    const d = new Date();
    d.setHours(hour);
    d.setMinutes(minute);
    d.setSeconds(0);
    onConfirm(d);
  };
  const selectionTop = (WHEEL_VIEWPORT_HEIGHT - ITEM_HEIGHT) / 2;
  if (!visible) return null;

  return (
    <View style={styles.overlayRoot} pointerEvents="box-none">
      <Pressable style={styles.overlayBackdrop} onPress={onCancel} />
      <View
        style={{
          paddingTop: 12,
          paddingHorizontal: 16,
          paddingBottom: Math.max(16, insets.bottom + 8),
        }}
      >
        <View
          style={{
            borderRadius: 20,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.08)',
            backgroundColor: 'rgba(10,10,18,0.9)',
          }}
        >
          <LinearGradient
            colors={['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.02)', 'rgba(0,0,0,0.4)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ paddingHorizontal: H_PADDING, paddingTop: H_PADDING, paddingBottom: 12 }}
          >
            <Text style={{ color: 'rgba(212,212,224,0.8)', fontSize: 14, textAlign: 'center', marginBottom: 12 }}>
              Select Time
            </Text>
            <View style={{ position: 'relative', height: WHEEL_VIEWPORT_HEIGHT }}>
              <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 16 }}>
                <Wheel data={hours} value={hour} width={90} format={(v) => pad(v)} onChange={setHour} />
                <Wheel data={minutes} value={minute} width={90} format={(v) => pad(v)} onChange={setMinute} />
              </View>
              <View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: selectionTop,
                  height: ITEM_HEIGHT,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: 'rgba(201,168,76,0.35)',
                  backgroundColor: 'rgba(201,168,76,0.05)',
                }}
              />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 }}>
              <Pressable onPress={onCancel} style={{ paddingVertical: 10, paddingHorizontal: 16 }}>
                <Text style={{ color: 'rgba(212,212,224,0.6)' }}>Cancel</Text>
              </Pressable>
              <Pressable onPress={confirm} style={{ paddingVertical: 10, paddingHorizontal: 16 }}>
                <Text style={{ color: 'rgba(201,168,76,0.9)' }}>Done</Text>
              </Pressable>
            </View>
          </LinearGradient>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlayRoot: {
    ...StyleSheet.absoluteFillObject,
    zIndex: OVERLAY_Z_INDEX,
    elevation: OVERLAY_Z_INDEX,
    justifyContent: 'flex-end',
  },
  overlayBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(6,6,12,0.65)',
  },
});
