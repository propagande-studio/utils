import { P } from "@propagande/utils";
import { type TickerHandler, type ViewportHandler } from "@propagande/utils/shared";
import { useFrame, useResize, useGSAPContext, useDampedValue, type DampedOpts } from "@propagande/utils/voir";
import { type SplitTextAnimatorInstance } from "@propagande/utils/gsap";

const frame: TickerHandler = ({ dt }) => P.Damp(0, 1, 8, dt);
const resize: ViewportHandler = ({ width }, viewport) => { viewport.width = width; };
useFrame(frame);
useResize(resize);
useGSAPContext((ctx) => { ctx.add(() => {}); });
const options: DampedOpts = { target: 10, decimal: 2 };
const value: number = useDampedValue(options).damped.value;
const clear = (instance: SplitTextAnimatorInstance) => instance.clearAnimations();
void value;
void clear;
// @ts-expect-error Published declarations must reject a string argument.
P.Lerp("wrong", 10, 0.5);
// @ts-expect-error Published declarations must reject an invalid ticker callback.
useFrame((time: string) => time);
