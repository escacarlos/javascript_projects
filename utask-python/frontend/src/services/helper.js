export function handleError(createToast, error, title, body) {
  if (error?.body?.errors && error.body.errors.length > 0) {
    error.body.errors.forEach(error => {
      if (error.field === undefined || error.field === null || error.field === '') {
        createToast?.({
          title: title,
          body: body,
          variant: 'danger',
          autoHideDelay: 3000,
        });
      } else {
        createToast?.({
          title: 'Error',
          body: "Field " + error.field + ' has an error : ' + error.message,
          variant: 'danger',
          autoHideDelay: 3000,
        });
      }
    })
  } else {
    createToast?.({
        title: title,
        body: body,
        variant: 'danger',
        autoHideDelay: 3000,
    });
  }
}