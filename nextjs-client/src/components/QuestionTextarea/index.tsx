/**
 * 文本域组件
 * 用于问卷中的多行文本输入问题
 */
import { FC } from "react";
import styles from "./index.module.scss";

/**
 * 文本域组件属性类型
 */
type PropsType = {
  fe_id: string;           // 前端组件ID，用于表单提交和元素标识
  props: {
    title: string;         // 问题标题
    placeholder?: string;   // 文本域占位符
  };
};

/**
 * 文本域组件
 * @param fe_id 前端组件ID
 * @param props 组件属性
 * @returns 文本域组件JSX
 */
const QuestionTextarea: FC<PropsType> = ({ fe_id, props }) => {
  const { title, placeholder } = props;

  return (
    <>
      {/* 问题标题 */}
      <p>{title}</p>
      {/* 文本域 */}
      <div className={styles.textAreaWrapper}>
        <textarea name={fe_id} placeholder={placeholder} rows={5} />
      </div>
    </>
  );
};

export default QuestionTextarea;
