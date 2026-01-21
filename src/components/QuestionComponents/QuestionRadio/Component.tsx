import {
  FC,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { Typography, Radio, Space } from 'antd';
import { QuestionRadioPropsType, QuestionRadioDefaultProps } from './interface';

const { Paragraph } = Typography;

const QuestionRadio: FC<QuestionRadioPropsType> = (props) => {
  const {
    title,
    isVertical,
    autoVertical,
    options = [],
    value,
  } = {
    ...QuestionRadioDefaultProps,
    ...props,
  };

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [isAutoVertical, setIsAutoVertical] = useState<boolean>(false);

  const measureWrapped = useCallback(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const items = wrapper.querySelectorAll<HTMLElement>('.ant-space-item');
    if (items.length <= 1) {
      setIsAutoVertical(false);
      return;
    }

    const firstTop = items[0]?.offsetTop;
    if (firstTop == null) {
      setIsAutoVertical(false);
      return;
    }

    let wrapped = false;
    items.forEach((el) => {
      if (el.offsetTop !== firstTop) wrapped = true;
    });

    setIsAutoVertical((prev) => (prev === wrapped ? prev : wrapped));
  }, []);

  // 首次渲染/选项变化后测量一次（用 rAF 避免读取到旧布局）
  useLayoutEffect(() => {
    if (isVertical) return;
    if (autoVertical === false) return;
    const rafId = window.requestAnimationFrame(measureWrapped);
    return () => window.cancelAnimationFrame(rafId);
  }, [autoVertical, isVertical, measureWrapped, options]);

  // 容器宽度变化时重新测量
  useEffect(() => {
    if (isVertical) return undefined;
    if (autoVertical === false) return undefined;
    const wrapper = wrapperRef.current;
    if (!wrapper) return undefined;

    const ro = new ResizeObserver(() => {
      measureWrapped();
    });
    ro.observe(wrapper);
    return () => ro.disconnect();
  }, [autoVertical, isVertical, measureWrapped]);

  const finalIsVertical = Boolean(
    isVertical || (autoVertical !== false && isAutoVertical)
  );

  return (
    <div>
      <Paragraph strong>{title}</Paragraph>
      <Radio.Group value={value}>
        <div ref={wrapperRef}>
          <Space
            direction={finalIsVertical ? 'vertical' : 'horizontal'}
            wrap={!finalIsVertical}
          >
            {options.map((opt) => {
              const { value, text } = opt;
              return (
                <Radio key={value} value={value}>
                  {text}
                </Radio>
              );
            })}
          </Space>
        </div>
      </Radio.Group>
    </div>
  );
};

export default QuestionRadio;
