import ToastInterface from '../../../types/interfaces/toast';
import { MouseEvent, useContext } from 'react';
import { ToastContext } from '../../../contexts/toast-context';

const TOAST_CLASSES = {
  primary: 'toast-primary',
  secondary: 'toast-secondary',
  success: 'toast-success',
  warning: 'toast-warning',
  danger: 'toast-danger',
};

const Toast = ({ id, color, title, body, actions }: ToastInterface) => {
  const { removeToast } = useContext(ToastContext);

  const handleToastClick = (e: MouseEvent<HTMLDivElement>) => {
    const classListArr = Array.from((e.target as HTMLButtonElement).classList);
    if (!classListArr.includes('action')) removeToast(id);
  };

  return (
    <div
      onClick={handleToastClick}
      className={`${TOAST_CLASSES[color]} w-full rounded-xl bg-white dark:bg-slate-700 border border-paper-2 shadow-lg dark:shadow-2xl flex items-stretch text-sm relative cursor-pointer text-primary`}
    >
      <div className="w-full p-4 space-y-1">
        {title && <h6 className="font-semibold">{title}</h6>}
        {body && <p className="text-ink-soft dark:text-slate-300">{body}</p>}
        <div className="max-w-fit flex flex-wrap justify-start items-start">
          {actions?.map((a, index) => {
            return (
              <button
                key={index}
                className="text-accent font-semibold hover:underline text-center pr-2 action"
                onClick={() => a.action()}
              >
                {a.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Toast;
